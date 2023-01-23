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

      it('should return them', (done) => {
        request(server.app)
          .get(`/groups/${groupId}/assignments`)
          .expect(200)
          .expect('Content-Type', /json/)
          .expect((res) => {
            expect(res.body).to.exist;
            expect(res.body.length).to.equal(10);
          })
          .end(done);
      });
    });

    describe('when assignments do not exist', () => {
      it('should return NO_CONTENT', (done) => {
        request(server.app).get(`/groups/${groupId}/assignments`).expect(204).end(done);
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

        it('should return it', (done) => {
          request(server.app)
            .get(`/groups/${groupId}/assignments/${assignment._id}`)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect((res) => {
              expect(res.body).to.be.an('object');
              expect(res.body.name).to.equal(assignment.name);
              expect(res.body.test).to.be.an('object');
              expect(res.body.test.name).to.equal(test.name);
              expect(res.body.test.document).to.be.an('object');
              expect(res.body.test.document.type).to.exists;
              expect(res.body.test.document.path).to.exists;
              expect(res.body.test.questions).to.be.an('array');
            })
            .end(done);
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

        it('should return it', (done) => {
          request(server.app)
            .get(`/groups/${groupId}/assignments/${assignment._id}`)
            .set('jwt-user', JSON.stringify(jwtUser))
            .expect(200)
            .expect('Content-Type', /json/)
            .expect((res) => {
              expect(res.body).to.be.an('object');
              expect(res.body.name).to.equal(assignment.name);
              expect(res.body.test).to.be.an('object');
              expect(res.body.test.name).to.equal(test.name);
              expect(res.body.test.document).to.be.an('object');
              expect(res.body.test.document.type).to.exists;
              expect(res.body.test.document.path).to.exists;
              expect(res.body.test.questions).to.be.an('array');
            })
            .end(done);
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

        it('should return BAD_REQUEST', (done) => {
          request(server.app)
            .get(`/groups/${groupId}/assignments/${assignment._id}`)
            .set('jwt-user', JSON.stringify(jwtUser))
            .expect(400)
            .end(done);
        });
      });
    });

    describe('when assignment does not exist', () => {
      it('should return NOT_FOUND', (done) => {
        request(server.app)
          .get(`/groups/${groupId}/assignments/000000000000000000000000`)
          .expect(404)
          .end(done);
      });
    });
  });

  describe('POST /:groupId/assignments', () => {});

  describe('PUT /:groupId/assignments/:assignmentId', () => {});

  describe('DELETE /:groupId/assignments/:assignmentId', () => {});
});
