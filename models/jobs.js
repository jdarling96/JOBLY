"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company");
const { sqlForPartialUpdate } = require("../helpers/sql");

class jobs {
  static async create({ title, salary, equity, company_handle }) {
    const checkCompany = await Company.get(company_handle);
    if (checkCompany) {
      const result = await db.query(
        `INSERT INTO jobs
             (title, salary, equity, company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING id,title, salary, equity, company_handle AS "companyHandle"`,
        [title, salary, equity, checkCompany.handle]
      );
      const job = result.rows[0];

      return job;
    }
  }

  static async findAll(searchFilters) {
    let query = `SELECT 
                 title, 
                 salary, 
                 equity, 
                 company_handle AS "companyHandle"
                 FROM jobs
                 `;

    let whereExpressions = [];
    let queryValues = [];

    const { title, minSalary, hasEquity } = searchFilters;

    if (minSalary < 0 || Number.isInteger(hasEquity))
      throw new BadRequestError("Invalid filter constraint");

    if (title !== undefined) {
      queryValues.push(title);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`salary >= $${queryValues.length}`);
    }

    if (hasEquity) {
      queryValues.push(hasEquity);
      whereExpressions.push(`equity > $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += " ORDER BY company_handle";

    const jobs = await db.query(query, queryValues);
    return jobs.rows;
  }

  static async get(id) {
    const result = await db.query(
      `SELECT
         id, 
         title,
         salary,
         equity,
         company_handle AS companyHandle
         FROM jobs
         WHERE id=$1`,
      [id]
    );

    if (!result.rows[0]) {
      throw new NotFoundError(`No job associated with id:${id}`);
    }

    const job = result.rows[0];
    return job;
  }

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyName: "company_name",
    });

    const titleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
    SET ${setCols} 
    WHERE id = ${titleVarIdx} 
    RETURNING id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"`;
const result = await db.query(querySql, [...values, id]);
const job = result.rows[0];

if(!job) throw new NotFoundError(`No job associated with id:${id}`)
return job

}

static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job associated with id:${id}`);
  }

}
