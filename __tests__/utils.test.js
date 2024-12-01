const { expiredCount } = require("../db/connection");
const {insertUsers,insertPropertyTypes} = require("../db/data-inserts");
const manageTables = require("../db/manage-tables");
const { createUserRef, createRef, formatData } = require("../db/utils");
const {usersData,propertyTypesData,propertiesData} = require("../db/data/test");
const db = require("../db/connection");

describe("utils",()=>{
    let testUsers;
    let testData;
    beforeAll(async () => {
        await manageTables();
        const result = await insertUsers(usersData);
        testUsers = result.rows;
        const result2 = await insertPropertyTypes(propertyTypesData);
        testData = result2.rows;
    });
    afterAll(async () => {
        await db.end();
    });
    describe("createUserRef",()=>{
        test("returns an object",()=>{
            const treatedUsers = createUserRef(testUsers);
            expect(typeof treatedUsers).toBe("object");
        })
        test("returned object each has a key value pair for each object in original array",()=>{
            const treatedUsers = createUserRef(testUsers);
            expect(Object.keys(treatedUsers)).toHaveLength(testUsers.length);
        })
        test("returned array has expected id paired with expected names",()=>{
            const treatedUsers = createUserRef(testUsers);
            testUsers.forEach((user)=>{
                const testFullName = `${user.first_name} ${user.surname}`;
                expect(treatedUsers[testFullName]).toEqual(user.user_id);
            })
        })
        test("original array has not been mutated",()=>{
            const originalUsers = [...testUsers];
            createUserRef(testUsers);
            expect(testUsers).toEqual(originalUsers);
        })
    });

    describe("createRef",()=>{
        test("returns an object",()=>{
            const treatedData = createRef("property_type","property_type_id",testData);
            expect(typeof treatedData).toBe("object");
        })
        test("returned object each has a key value pair for each object in original array",()=>{
            const treatedData = createRef("property_type","property_type_id",testData);
            expect(Object.keys(treatedData)).toHaveLength(testData.length);
        })
        test("returned array has expected id paired with expected type",()=>{
            const treatedData = createRef("property_type","property_type_id",testData);
            testData.forEach((data)=>{
                expect(treatedData[data.property_type]).toEqual(data.property_type_id);
            })
        })
        test("original array has not been mutated",()=>{
            const originalData = [...testData];
            createRef("property_type","property_type_id",testData);
            expect(testData).toEqual(originalData);
        })

    });
    describe("formatData", () => {
        test("returns an array", () => {
          expect(Array.isArray(formatData({}, "", "", []))).toBe(true);
        });
        test("removes keyToRemove property", () => {
          const keyToRemove = "name";
          const formattedData = formatData({ david: 1 }, keyToRemove, "id", [
            { name: "david" },
          ]);
      
          expect(formattedData[0]).not.toHaveProperty("name");
        });
        test("adds keyToAdd property", () => {
          const keyToAdd = "id";
          const formattedData = formatData({ david: 1 }, "name", keyToAdd, [
            { name: "david" },
          ]);
      
          expect(formattedData[0]).toHaveProperty("id");
        });
        test("keyToAdd property has value from refObj", () => {
          const keyToAdd = "id";
          const formattedData = formatData({ david: 1 }, "name", keyToAdd, [
            { name: "david" },
          ]);
      
          expect(formattedData[0].id).toBe(1);
        });
        test("does not mutate raw data", () => {
          const rawData = [{ name: "david" }];
          formatData({ david: 1 }, "name", "id", rawData);
      
          expect(rawData).toEqual([{ name: "david" }]);
        });
        test("does all of the above with multiple refObjs and keys",()=>{
        const rawData = [{ name: "david",name2: "steven" }];
        const keysToAdd = ["id","id2"];
          const formattedData = formatData([{ david: 1 },{steven:2}], ["name","name2"], keysToAdd, rawData);
        expect(formattedData[0]).not.toHaveProperty("name");
        expect(formattedData[0]).not.toHaveProperty("name2");
        expect(formattedData[0]).toHaveProperty("id");
        expect(formattedData[0]).toHaveProperty("id2");
        expect(formattedData[0].id).toBe(1);
        expect(formattedData[0].id2).toBe(2);
        expect(rawData).toEqual([{ name: "david",name2:"steven" }]);

        })
      });
});