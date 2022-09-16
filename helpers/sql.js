const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/* This function allows us to update partial data in sql dynamically. 
Not all fields need to be updated when we want to update our data. The values passed through in our model methods
will be ran through this function which will extract and set the values that need to be updated in SQL.*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  // extract the keys from our data {}
  if (keys.length === 0) throw new BadRequestError("No data");
  // throw error if empty data {} was passed through

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
// set keys to sql column names and set values to idx plus 1 (best practice to avoid SQL injection)
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
// return setCols as a string of SQL columns to be changed.
// return values as list of values that correspond to columns.
}

module.exports = { sqlForPartialUpdate };
