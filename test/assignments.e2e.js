import request from 'supertest';
import { stub } from 'sinon';
import sinonChai from 'sinon-chai';
import chai, { expect } from 'chai';
import { ObjectId } from 'mongodb';

import server from '../src/app.js';

import { Assignment } from '../src/models/assignment.js';
import { Test } from '../src/models/test.js';
import s3Service from '../src/services/s3.service.js';

chai.use(sinonChai);

describe('Assignments e2e', () => {
  const groupId = new ObjectId();

  async function createAssignment(assignment, test) {
    let testId = new ObjectId();
    if (test) {
      const createdTest = await Test.create({
        name: 'name',
        document: {
          type: 'application/pdf',
          path: 'path',
        },
        questions: [],
        ...test,
      });
      testId = createdTest._id;
    }
    return await Assignment.create({
      groupId: new ObjectId(),
      testId,
      name: 'name',
      ...assignment,
    });
  }

  afterEach(async () => {
    await Assignment.deleteMany({});
    await Test.deleteMany({});
  });

  describe('GET /:groupId/assignments', () => {
    describe('when assignments exists', () => {
      beforeEach(async () => {
        await Promise.all(
          [...Array(10).keys()].map(async () => await createAssignment({ groupId }))
        );
      });

      it('should return them', async () => {
        const res = await request(server.app).get(`/groups/${groupId}/assignments`);
        expect(res.statusCode).to.equal(200);

        expect(res.body).to.exist;
        expect(res.body.length).to.equal(10);
      });
    });

    describe('when assignments do not exist', () => {
      it('should return NO_CONTENT', async () => {
        const res = await request(server.app).get(`/groups/${groupId}/assignments`);
        expect(res.statusCode).to.equal(204);
      });
    });
  });

  describe('GET /:groupId/assignments/:assignmentId', () => {
    describe('when user is a teacher', () => {
      describe('when assignment exists', () => {
        let assignment;
        let test = { name: 'testName' };

        beforeEach(async () => {
          stub(s3Service, 'getDownloadUrl').resolves('downloadUrl');
          assignment = await createAssignment({ groupId }, test);
        });

        afterEach(() => {
          s3Service.getDownloadUrl.restore();
        });

        it('should return it', async () => {
          const res = await request(server.app).get(
            `/groups/${groupId}/assignments/${assignment._id}`
          );
          expect(res.statusCode).to.equal(200);

          expect(res.body).to.be.an('object');
          expect(res.body.name).to.equal(assignment.name);
          expect(res.body.test).to.be.an('object');
          expect(res.body.test.name).to.equal(test.name);
          expect(res.body.test.document).to.be.an('object');
          expect(res.body.test.document.type).to.exists;
          expect(res.body.test.document.path).to.exists;
          expect(res.body.test.questions).to.be.an('array');
        });
      });
    });

    describe('when user is a student', () => {
      const jwtUser = {
        userId: 'test-user-id',
        role: 'student',
        email: 'test_user_email@xploristo.org',
        firstName: 'Test',
        lastName: 'User',
      };
      describe('when assignment exists', () => {
        let assignment;
        let test = { name: 'testName' };

        beforeEach(async () => {
          stub(s3Service, 'getDownloadUrl').resolves('downloadUrl');
          assignment = await createAssignment({ groupId }, test);
        });

        afterEach(() => {
          s3Service.getDownloadUrl.restore();
        });

        it('should return it', async () => {
          const res = await request(server.app)
            .get(`/groups/${groupId}/assignments/${assignment._id}`)
            .set('jwt-user', JSON.stringify(jwtUser));
          expect(res.statusCode).to.equal(200);

          expect(res.body).to.be.an('object');
          expect(res.body.name).to.equal(assignment.name);
          expect(res.body.test).to.be.an('object');
          expect(res.body.test.name).to.equal(test.name);
          expect(res.body.test.document).to.be.an('object');
          expect(res.body.test.document.type).to.exists;
          expect(res.body.test.document.path).to.exists;
          expect(res.body.test.questions).to.be.an('array');
        });
      });
      describe('when assignment is out of time', () => {
        let assignment;
        let dayBeforeYesterday = new Date(new Date().getTime() - 48 * 60 * 60 * 1000);
        let yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

        beforeEach(async () => {
          assignment = await createAssignment({
            groupId,
            startDate: dayBeforeYesterday,
            endDate: yesterday,
          });
        });

        it('should return BAD_REQUEST', async () => {
          const res = await request(server.app)
            .get(`/groups/${groupId}/assignments/${assignment._id}`)
            .set('jwt-user', JSON.stringify(jwtUser));
          expect(res.statusCode).to.equal(400);
        });
      });
    });

    describe('when assignment does not exist', () => {
      it('should return NOT_FOUND', async () => {
        const res = await request(server.app).get(
          `/groups/${groupId}/assignments/000000000000000000000000`
        );
        expect(res.statusCode).to.equal(404);
      });
    });
  });

  describe('POST /:groupId/assignments', () => {
    let assignment;

    describe('when assignment does not have a start or end date', () => {
      beforeEach(() => {
        assignment = {
          groupId,
          testId: new ObjectId(),
          name: 'testWithNoDates',
        };
      });

      it('should create it with no dates', async () => {
        const res = await request(server.app)
          .post(`/groups/${groupId}/assignments`)
          .send(assignment);

        expect(res.statusCode).to.equal(201);
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal(assignment.name);
        expect(res.body.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(res.body.testId.toString()).to.equal(assignment.testId.toString());
        expect(res.body.startDate).to.not.exists;
        expect(res.body.endDate).to.not.exists;

        const createdAssignment = await Assignment.findById(res.body._id);
        expect(createdAssignment.name).to.equal(assignment.name);
        expect(createdAssignment.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(createdAssignment.testId.toString()).to.equal(assignment.testId.toString());
        expect(createdAssignment.startDate).to.not.exists;
        expect(createdAssignment.endDate).to.not.exists;
      });
    });

    describe('when assignment does only have an end date', () => {
      let tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

      beforeEach(() => {
        assignment = {
          groupId,
          testId: new ObjectId(),
          name: 'testWithDates',
          endDate: tomorrow,
        };
      });

      it('should create it with an end date', async () => {
        const res = await request(server.app)
          .post(`/groups/${groupId}/assignments`)
          .send(assignment);

        expect(res.statusCode).to.equal(201);
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal(assignment.name);
        expect(res.body.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(res.body.testId.toString()).to.equal(assignment.testId.toString());
        expect(res.body.startDate).to.not.exists;
        expect(res.body.endDate).to.equal(assignment.endDate.toISOString());

        const createdAssignment = await Assignment.findById(res.body._id);
        expect(createdAssignment.name).to.equal(assignment.name);
        expect(createdAssignment.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(createdAssignment.testId.toString()).to.equal(assignment.testId.toString());
        expect(createdAssignment.startDate).to.not.exists;
        expect(createdAssignment.endDate.toISOString()).to.equal(assignment.endDate.toISOString());
      });
    });

    describe('when assignment does have a start and end date', () => {
      let today = new Date();
      let tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

      beforeEach(() => {
        assignment = {
          groupId,
          testId: new ObjectId(),
          name: 'testWithDates',
          startDate: today,
          endDate: tomorrow,
        };
      });

      it('should create it with start and end date', async () => {
        const res = await request(server.app)
          .post(`/groups/${groupId}/assignments`)
          .send(assignment);

        expect(res.statusCode).to.equal(201);
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal(assignment.name);
        expect(res.body.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(res.body.testId.toString()).to.equal(assignment.testId.toString());
        expect(res.body.startDate).to.equal(assignment.startDate.toISOString());
        expect(res.body.endDate).to.equal(assignment.endDate.toISOString());

        const createdAssignment = await Assignment.findById(res.body._id);
        expect(createdAssignment.name).to.equal(assignment.name);
        expect(createdAssignment.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(createdAssignment.testId.toString()).to.equal(assignment.testId.toString());
        expect(createdAssignment.startDate.toISOString()).to.equal(
          assignment.startDate.toISOString()
        );
        expect(createdAssignment.endDate.toISOString()).to.equal(assignment.endDate.toISOString());
      });
    });

    describe('when assignment does have an end date before the start date', () => {
      let today = new Date();
      let tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

      beforeEach(() => {
        assignment = {
          groupId,
          testId: new ObjectId(),
          name: 'testWithInvalidDates',
          startDate: tomorrow,
          endDate: today,
        };
      });

      it('should return BAD_REQUEST', async () => {
        const res = await request(server.app)
          .post(`/groups/${groupId}/assignments`)
          .send(assignment);
        expect(res.statusCode).to.equal(400);
      });
    });
  });

  describe('PUT /:groupId/assignments/:assignmentId', () => {
    let assignment;

    describe('when updated assignment does not have a start or end date', () => {
      beforeEach(async () => {
        assignment = await createAssignment({
          groupId,
          testId: new ObjectId(),
          name: 'testWithNoDates',
        });
      });

      it('should update it with no dates', async () => {
        const newName = 'updatedTestWithNoDates';
        const res = await request(server.app)
          .put(`/groups/${groupId}/assignments/${assignment._id}`)
          .send({ name: newName });

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal(newName);
        expect(res.body.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(res.body.testId.toString()).to.equal(assignment.testId.toString());
        expect(res.body.startDate).to.not.exists;
        expect(res.body.endDate).to.not.exists;

        const updatedAssignment = await Assignment.findById(res.body._id);
        expect(updatedAssignment.name).to.equal(newName);
        expect(updatedAssignment.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(updatedAssignment.testId.toString()).to.equal(assignment.testId.toString());
        expect(updatedAssignment.startDate).to.not.exists;
        expect(updatedAssignment.endDate).to.not.exists;
      });
    });

    describe('when updated assignment does have a start and end date', () => {
      let today = new Date();
      let tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
      let twoDaysAfterToday = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000);

      beforeEach(async () => {
        assignment = await createAssignment({
          groupId,
          testId: new ObjectId(),
          name: 'testWithNoDates',
          startDate: today,
          endDate: tomorrow,
        });
      });

      it('should update its start and end date', async () => {
        const newEndDate = twoDaysAfterToday;
        const res = await request(server.app)
          .put(`/groups/${groupId}/assignments/${assignment._id}`)
          .send({ endDate: newEndDate });

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal(assignment.name);
        expect(res.body.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(res.body.testId.toString()).to.equal(assignment.testId.toString());
        expect(res.body.startDate).to.equal(assignment.startDate.toISOString());
        expect(res.body.endDate).to.equal(newEndDate.toISOString());

        const updatedAssignment = await Assignment.findById(res.body._id);
        expect(updatedAssignment.name).to.equal(assignment.name);
        expect(updatedAssignment.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(updatedAssignment.testId.toString()).to.equal(assignment.testId.toString());
        expect(updatedAssignment.startDate.toISOString()).to.equal(
          assignment.startDate.toISOString()
        );
        expect(updatedAssignment.endDate.toISOString()).to.equal(newEndDate.toISOString());
      });
    });

    describe('when updated assignment does only have an end date', () => {
      let tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
      let twoDaysAfterToday = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000);

      beforeEach(async () => {
        assignment = await createAssignment({
          groupId,
          testId: new ObjectId(),
          name: 'testWithNoDates',
          endDate: tomorrow,
        });
      });

      it('should update it with the new end date', async () => {
        const newEndDate = twoDaysAfterToday;
        const res = await request(server.app)
          .put(`/groups/${groupId}/assignments/${assignment._id}`)
          .send({ endDate: newEndDate });

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal(assignment.name);
        expect(res.body.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(res.body.testId.toString()).to.equal(assignment.testId.toString());
        expect(res.body.startDate).to.not.exists;
        expect(res.body.endDate).to.equal(newEndDate.toISOString());

        const createdAssignment = await Assignment.findById(res.body._id);
        expect(createdAssignment.name).to.equal(assignment.name);
        expect(createdAssignment.groupId.toString()).to.equal(assignment.groupId.toString());
        expect(createdAssignment.testId.toString()).to.equal(assignment.testId.toString());
        expect(createdAssignment.startDate).to.not.exists;
        expect(createdAssignment.endDate.toISOString()).to.equal(newEndDate.toISOString());
      });
    });

    describe('when updated assignment does have an end date before the start date', () => {
      let today = new Date();
      let tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

      beforeEach(async () => {
        assignment = await createAssignment({
          groupId,
          testId: new ObjectId(),
          name: 'testWithNoDates',
          startDate: today,
          endDate: tomorrow,
        });
      });

      it('should return BAD_REQUEST', async () => {
        const res = await request(server.app)
          .put(`/groups/${groupId}/assignments/${assignment._id}`)
          .send({ startDate: tomorrow, endDate: today });
        expect(res.statusCode).to.equal(400);
      });
    });
  });

  describe('DELETE /:groupId/assignments/:assignmentId', () => {
    describe('when assignment does exist', () => {
      let assignment;

      beforeEach(async () => {
        assignment = await createAssignment({ groupId });
      });

      it('should delete it', async () => {
        const res = await request(server.app).delete(
          `/groups/${groupId}/assignments/${assignment._id}`
        );
        expect(res.statusCode).to.equal(200);

        const deletedAssignment = await Assignment.findById(assignment._id);
        expect(deletedAssignment).not.to.exist;
      });
    });

    describe('when assignment does not exist', () => {
      it('should return NOT_FOUND', async () => {
        const res = await request(server.app).delete(
          `/groups/${groupId}/assignments/000000000000000000000000`
        );
        expect(res.statusCode).to.equal(404);
      });
    });
  });
});
