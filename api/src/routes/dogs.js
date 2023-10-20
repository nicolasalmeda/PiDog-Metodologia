const { Router } = require("express");
const { Op } = require("sequelize");
const { Dog, Temperament } = require("../db.js");
const axios = require("axios");
const router = Router();
const { splitByScript, splitByColon } = require("../tools/tools.js");

/********************** [ ] GET /dogs: ************************/
/********************** [ ] GET /dogs?name=***: ***************/

router.get("/", async (req, res) => {
  console.log("Entre a la ruta del get dogs");
  const { name } = req.query;
  let apiKey = "live_Ij5rWZtWyitGUVJ0rtaGjFwsn2PFjb2g0vVWXzf6efQb79WYFB91oJWFFJ8daYDJ"

  if (name) {
    // Si me pasan un nombre...
    try {
      console.log(name);

      // 1.- Traigo todo lo de la BdD.
      var dogsBreedByNameBdD = await Dog.findAll({
        include: {
          model: Temperament,
          attributes: {
            include: ["name"],
          },
          through: {
            attributes: [],
          },
        },
      });
      // 2.- Traigo todo lo de la API.
      
      let dogsApi = await axios.get("https://api.thedogapi.com/v1/breeds", {
        header:{
          'x_apy_key': apiKey
        }

      });
      let dogsBreedByNameAPI = dogsApi.data.map((d) => {
        return {
          id: d.id,
          name: d.name,
          height: splitByScript(d.height.metric),

          weight: splitByScript(d.weight.metric),

          life_span: splitByScript(d.life_span),

          
          image: `https://api.thedogapi.com/v1/images/${d.reference_image_id}`,


          temperament: splitByColon(d.temperament),
        };
      });
      for (let i = 0; i < allApiDogs.length; i++) {
        try {
          const imageResponse = await axios.get(allApiDogs[i].image);
          allApiDogs[i].imageData = imageResponse.data; // Aquí guardas los datos de la imagen
        } catch (err) {
          console.log("error en el for" , err)
        }
      }

      console.log(allApiDogs)

      let allDogsBreedByName = await Promise.all([dogsBreedByNameBdD]).then(
        (results) => {
          const [dogsBreedsByNameBdD] = results;
          const response = dogsBreedsByNameBdD.concat(dogsBreedByNameAPI);
          return response;
        }
      );
      // Filtro de todas las razas (allDogsBreedByName) las que coincidan con el nombre pasado por query.
      let result = [];
      for (let i = 0; i < allDogsBreedByName.length; i++) {
        if (
          allDogsBreedByName[i].name
            .toLowerCase()
            .includes(name.toLocaleLowerCase())
        ) {
          result.push(allDogsBreedByName[i]);
        }
      }
      // Devuelvo los resultados.
      res.send(result).status(200);
    } catch (err) {
      res.sendStatus(404).send("Breed not found");
    }
  } else {
    // Si no pasan un nombre, traeme todo.
    console.log("No me pasaron nombre")

    try {
      //API

      let dogsApi = await axios.get("https://api.thedogapi.com/v1/breeds", {
        header:{
          'x_apy_key': apiKey
        }
      });
      console.log(dogsApi)
      let allApiDogs = dogsApi.data.map((d) => {
        return {
          id: d.id,
          name: d.name,
          height: splitByScript(d.height.metric),

          weight: splitByScript(d.weight.metric),

          life_span: splitByScript(d.life_span),

          image: `https://api.thedogapi.com/v1/images/${d.reference_image_id}`,

          temperament: splitByColon(d.temperament),
        };
      });

      // for (let i = 0; i < allApiDogs.length; i++) {
      //   try {
      //     const imageResponse = await axios.get(allApiDogs[i].image);
      //     allApiDogs[i].imageData = imageResponse.data; // Aquí guardas los datos de la imagen
      //     allApiDogs[i].image = allApiDogs[i].imageData.url
      //   } catch (err) {
      //     // Manejar errores si la solicitud de imagen falla
      //   }
      // }

      const imageRequests = allApiDogs.map(async (dog) => {
        try {
          const imageResponse = await axios.get(dog.image);
          dog.imageData = imageResponse.data; // Aquí guardas los datos de la imagen
          dog.image = dog.imageData.url;
        } catch (err) {
          // Manejar errores si la solicitud de imagen falla
        }
      });

      await Promise.all(imageRequests);

      console.log(allApiDogs)
      // BdD
      let allDbDogs = await Dog.findAll({
        include: {
          model: Temperament,
          attributes: ["name"],
          through: {
            attributes: [],
          },
        },
      });

      let allDogs = allApiDogs.concat(allDbDogs);
      res.json(allDogs);
    } catch (err) {
      res.sendStatus(404);
    }
  }
});



/********************** [ ] GET /dogs/:id***: ***************/

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  let dogsApi = await axios.get("https://api.thedogapi.com/v1/breeds");
  let allApiDogs = dogsApi.data.map((d) => {
    return {
      id: d.id,
      name: d.name,
      height: splitByScript(d.height.metric),

      weight: splitByScript(d.weight.metric),

      life_span: splitByScript(d.life_span),

      image: d.image.url,

      temperament: splitByColon(d.temperament),
    };
  });
  // BdD
  let allDbDogs = await Dog.findAll({
    include: {
      model: Temperament,
      attributes: ["name"],
      through: {
        attributes: [],
      },
    },
  });

  let allDogs = allApiDogs.concat(allDbDogs);

  if (id) {
    let dogId = allDogs.filter((dog) => dog.id == id);
    if (dogId.length) {
      res.status(200).json(dogId);
    }
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;
