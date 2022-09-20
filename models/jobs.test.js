"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Jobs = require("./jobs");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 1000,
    equity: 0.456,
    company_handle: "c1",
  };

  test("works", async () => {
    const resp = await Jobs.create(newJob);
    expect(resp).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 1000,
      equity: "0.456",
      companyHandle: "c1",
    });
    const result = await db.query(
      `SELECT title, salary, equity, company_handle
             FROM jobs
             WHERE title = 'new'`
    );
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 1000,
        equity: "0.456",
        company_handle: "c1",
      },
    ]);
  });

  /* test("bad request with dupe", async function () {
        try {
          await Jobs.create(newJob);
          await Jobs.create(newJob);
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      }); */
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async () => {
    const resp = await Jobs.findAll();
    expect(resp).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1000,
        equity: "0.44",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2000,
        equity: "0.55",
        companyHandle: "c2",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const findId = await db.query(
      `SELECT id
                 FROM jobs
                 WHERE title = 'j1'`
    );

    let job = await Jobs.get(findId.rows[0].id);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "j1",
      salary: 1000,
      equity: "0.44",
      companyHandle: "c1",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Jobs.get(9000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "new",
    salary: 1000,
    equity: 0.456,
  };

  test("works", async function () {
    const findId = await db.query(
      `SELECT id
                 FROM jobs
                 WHERE title = 'j1'`
    );
    let job = await Jobs.update(findId.rows[0].id, updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 1000,
      equity: "0.456",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
                 FROM jobs
                 WHERE id = $1`,
      [findId.rows[0].id]
    );
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "new",
        salary: 1000,
        equity: "0.456",
        company_handle: "c1",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Jobs.update(9000, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      const findId = await db.query(
        `SELECT id
                 FROM jobs
                 WHERE title = 'j1'`
      );
      await Jobs.update(findId.rows[0].id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const findId = await db.query(
      `SELECT id
         FROM jobs
         WHERE title = 'j1'`
    );

    await Jobs.remove(findId.rows[0].id);
    const res = await db.query("SELECT id FROM jobs WHERE id= $1", [
      findId.rows[0].id,
    ]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Jobs.remove(9000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
