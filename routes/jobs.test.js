"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("/POST jobs", function () {
  const newJob = {
    title: "new",
    salary: 75000,
    equity: 0.55,
    companyHandle: "c1",
  };
  test("ok for auth user(isAdmin: true)", async () => {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "new",
        salary: 75000,
        equity: "0.55",
        companyHandle: "c1",
      },
    });
  });

  test("unauth users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 75000,
        equity: 0.55,
        companyHandle: "c1",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 75000,
        equity: "0.55",
        companyHandle: "c1",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with no company name found", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 75000,
        equity: 0.55,
        companyHandle: "nope",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 75000,
          equity: "0.444",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "j2",
          salary: 85000,
          equity: "0.555",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************************* GET /companies with filters */

describe("GET /jobs with selected filters works with anon users", function () {
  test("test all filters applied", async function () {
    const resp = await request(app).get(
      "/jobs?title=j1&minSalary=75000&hasEquity=true"
    );
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 75000,
          equity: "0.444",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("test name", async function () {
    const resp = await request(app).get("/jobs?title=j1");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 75000,
          equity: "0.444",
          companyHandle: "c1",
        },
      ],
    });
  });
  test("test minSalary", async function () {
    const resp = await request(app).get("/jobs?minSalary=75000");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 75000,
          equity: "0.444",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "j2",
          salary: 85000,
          equity: "0.555",
          companyHandle: "c2",
        },
      ],
    });
  });
  test("test hasEquity", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 75000,
          equity: "0.444",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "j2",
          salary: 85000,
          equity: "0.555",
          companyHandle: "c2",
        },
      ],
    });
  });
  test("Invalid filter name should return status code 400", async function () {
    const resp = await request(app).get("/jobs?invalid=invalid");
    expect(resp.statusCode).toEqual(400);
  });
  test("minSalary thats less then 0 should return 400", async function () {
    const resp = await request(app).get("/jobs?minSalary=-1");
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const getId = await db.query(`SELECT id FROM jobs WHERE title = $1`, [
      "j1",
    ]);
    const id = getId.rows[0].id;
    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({
      job: {
        id: id,
        title: "j1",
        salary: 75000,
        equity: "0.444",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/jobs/9000`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for auth users", async function () {
    const getId = await db.query(`SELECT id FROM jobs WHERE title = $1`, [
      "j1",
    ]);
    const id = getId.rows[0].id;
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        salary: 65000,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: id,
        title: "j1",
        salary: 65000,
        equity: "0.444",
        companyHandle: "c1",
      },
    });
  });

  test("unauth users", async function () {
    const getId = await db.query(`SELECT id FROM jobs WHERE title = $1`, [
      "j1",
    ]);
    const id = getId.rows[0].id;
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        salary: 65000,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const getId = await db.query(`SELECT id FROM jobs WHERE title = $1`, [
      "j1",
    ]);
    const id = getId.rows[0].id;
    const resp = await request(app).patch(`/jobs/${id}`).send({
      salary: 65000,
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/9000`)
      .send({
        salary: 65000,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const getId = await db.query(`SELECT id FROM jobs WHERE title = $1`, [
      "j1",
    ]);
    const id = getId.rows[0].id;
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        id: 9000,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on company_handle change attempt", async function () {
    const getId = await db.query(`SELECT id FROM jobs WHERE title = $1`, [
      "j1",
    ]);
    const id = getId.rows[0].id;
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const getId = await db.query(`SELECT id FROM jobs WHERE title = $1`, [
      "j1",
    ]);
    const id = getId.rows[0].id;
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        equity: "0.5555",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for auth users", async function () {
    const getId = await db.query(`SELECT id FROM jobs WHERE title = $1`, [
      "j1",
    ]);
    const id = getId.rows[0].id;
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: expect.any(String) });
  });

  test("unauth users", async function () {
    const getId = await db.query(`SELECT id FROM jobs WHERE title = $1`, [
      "j1",
    ]);
    const id = getId.rows[0].id;
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const getId = await db.query(`SELECT id FROM jobs WHERE title = $1`, [
      "j1",
    ]);
    const id = getId.rows[0].id;
    const resp = await request(app).delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/9000`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
