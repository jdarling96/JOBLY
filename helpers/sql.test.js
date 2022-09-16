const { sqlForPartialUpdate } = require('./sql')
const { BadRequestError } = require("../expressError");

describe('Create partial data for updating db', function(){
    test('Returns col/values for updating a User', () => { 
        const reqBody = {
            firstName: "Billy",
            lastName: "Bob",
            }
        const Jstosql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
        }
        const {setCols, values} = sqlForPartialUpdate(reqBody, Jstosql)
        expect(setCols).toEqual('"first_name"=$1, "last_name"=$2')
        expect(values).toEqual(['Billy', 'Bob'])
    })
    

    test('Returns col/values for updating a Company', () => {
        const reqBody = {
            name: "updated-company-name",
            description: "updating this company"
        }
        const Jstosql = {
            numEmployees: "num_employees",
            logoUrl: "logo_url",
        }

        const{setCols, values} = sqlForPartialUpdate(reqBody, Jstosql)
        expect(setCols).toEqual(`"name"=$1, "description"=$2`)
        expect(values).toEqual(['updated-company-name','updating this company'])
    })

    test('Bad request if not data is passed through', () => {
        const reqBody = {}
        const Jstosql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
        }
        try {
            sqlForPartialUpdate(reqBody, Jstosql)
            
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy()
            
        }

    })
})