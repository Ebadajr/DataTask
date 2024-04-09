// App.ts
const mongoose = require("mongoose");

const mongoUri =
  "mongodb+srv://ebadajr:MJgn3Ya0mK5Lr30J@cluster0.ndbefa3.mongodb.net/";
import Brand from "./Models/brands.schema";
import { z } from "zod";
import { faker, fakerRO } from '@faker-js/faker';

(async () => {
  mongoose.connect(mongoUri).then(() => {
    console.log("MongoDB is now connected!");
  });
  const brands = await Brand.find({});
  

  for (const brand of brands) {
   //using zod for validating against the provided schema
    var currentDocument = z.object({
      brandName: z.string(),
      yearFounded: z.number().min(1600).max(2024),
      headquarters: z.string(),
      numberOfLocations: z.number().min(1),
    });


    //the 10 added documents using faker.js
    var newDoc = new Brand({
        brandName: faker.company.name(),
        yearFounded: faker.number.int({ min: 1600, max: 2024 }),
        headquarters: faker.location.city(),
        numberOfLocations: faker.number.int({ min: 1, max: 2024 })
    });
    await newDoc.save();

    try {
      //validating each brand against the created zod schema
      currentDocument.parse({
        brandName: brand.brandName,
        yearFounded: brand.yearFounded,
        headquarters: brand.headquarters,
        numberOfLocations: brand.numberOfLocations,
      });

     
    } catch (e) {
      if (e instanceof z.ZodError) {

        console.log("Validation error for brand with ID", brand._id);

        if (brand instanceof mongoose.Document) {
          const brandKeys = Object.keys(brand.toObject());
          const schemaKeys = Object.keys(currentDocument.shape);
          const extraFields = brandKeys.filter(
            (key) => !schemaKeys.includes(key)
          );
          //Fields with different names but needed values i.e yearCreated

         
          for (const issue of e.issues) {
            //for each document, looping over the issues founded
            switch (issue.path[0]) {
              case "yearFounded":
                if (extraFields.includes("yearCreated")) {
                  //getting the value from other fields
                  brand.yearFounded = brand.get("yearCreated");

                } else if (extraFields.includes("yearsFounded")) {

                    const y = parseInt(brand.get("yearsFounded"));
                    brand.yearFounded = new Date(y);
                } else {
                  brand.yearFounded = new Date(1600);
                }
                break;
              case "numberOfLocations":
                brand.numberOfLocations = 1;
                break;
              case "brandName":
                if (brand.get("brand").name) {
                  brand.brandName = brand.get("brand").name;
                }else{
                brand.brandName = "Brand";
                }
                break;
              case "headquarters":
                if (extraFields.includes("hqAddress")) {
                  brand.headquarters = brand.get("hqAddress");
                }
                break;
            }
          }
        }
      }
    }

    await brand.save();
  }
})();
