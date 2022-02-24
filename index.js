import express from 'express';
import read, {add, write} from './jsonFileStorage.js';
import fs from 'fs';
import methodOverride from 'method-override';

const app = express();
app.use(express.static('public'));
// Configure Express to parse request body data into request.body
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
const port = 3004

// Set view engine
app.set('view engine', 'ejs');

// listing of all UFO
app.get(`/`, (req, res) => {
  read(`data.json`, (error, jsonObjContent) => {
    if (error) {
      console.error (`read error` , error)
      return;
    } 
    const data = jsonObjContent.sightings;
    // put in an object so can use the key-value
    res.render(`listing`, {data}); 
    });
});

app.delete('/sighting/:index/delete', (request, response) => {
  // Remove element from DB at given index
  const { index } = request.params;
  read('data.json', (err, data) => {
    data['sightings'].splice(index, 1);
    console.log(data) 
    write('data.json', data, (err) => {
      const numOfRecords = {index : data.length};
      // response.render('listing',numOfRecords);
  
    });
    response.send(`Delete Successful!`)
  });
});


// Render the form to input new sightings
app.get('/sighting', (request, response) => {
  response.render('sighting');
});
// Save new sighting data sent via POST request from our form
app.post('/sighting', (request, response) => {
  // Add new sighting data in request.body to sightings array in data.json.
  console.log('before added sighting')
  add('data.json', 'sightings', request.body, (err) => {
    console.log('added sighting')
    if (err) {
      response.status(500).send('DB write error.');
      return;
    }
  });
  // Redirect to display new recording
  read(`data.json`, (error, jsonObjContent) => {
    if (error) {
      console.error(`read error`, error);
      return;
    }
    const data = jsonObjContent.sightings;
    // console.log(`data`,data)
    // const total = data.length
    let index = data.length
    console.log(`last index`, index);
    response.redirect(`/sighting/${index}`);
    });
})

// Display the sighting selected from listing page
app.get('/sighting/:index', (req,res) =>{
  read(`data.json`, (error, jsonObjContent) => {
    if (error) {
      console.error(`read error`, error);
      return;
    }
    const details = jsonObjContent.sightings[req.params.index];
    console.log(`details`, details);
    res.render(`single_sighting`, {details});
  });
  });

// Display the sighting to edit
app.get('/sighting/:index/edit', (req,res) =>{

 read(`data.json`, (error, jsonObjContent) => {
  if (error) {
   console.error(`read error`, error);
   return;
   }
  const {index} = req.params // req.params is an object..destructuring
  console.log(`type of req.params`, typeof req.params)
  console.log(req.params)
  console.log(`type of index`, typeof index)
  console.log(index)
  const oneSighting = jsonObjContent.sightings[index];
  oneSighting.index = index
  const details = {oneSighting}
  console.log(`details`, details);
  res.render(`editForm`, details);
  });
});

// BLOCKER_2!! Thunderclient is ok. Cannot route to ("/sighting/:index/")
app.put('/sighting/:index/edit', (req,res) =>{
    const {index} = req.params;
    console.log(`index`, index)
    read(`data.json`, (error, jsonObjContent) => {
    if (error) {
      console.error(`read error`, error);
      return;
    };
    console.log(req.body)
    jsonObjContent.sightings[index] = req.body;
    const details = jsonObjContent.sightings[index];
    console.log(details)
    
    write('data.json', jsonObjContent, (err) => {
    //   // res.send('Done!');
      res.render(`single_sighting`, {details});
    //   console.log(`request.body`, req.body)
    //   // console.log(`index`, index)  
    });
    
  });  
//     // await fs.promises.writeFile("data.json", JSON.stringify(jsonObjContent),{encoding: 'utf8' })
//     res.render(`single_sighting`, {details} )
  
})


app.get(`/shapes`, (req, res) => {
  
  read(`data.json`, (error, jsonObjContent)=>{
    if (error){
    // res.send(404).json(`data does not exist`)
    res.status(404).send("Data does not exist")
    // res.send("error in data")
    }
    let data = jsonObjContent.sightings
    // console.log(`contents`, data)

    // do the tally in .js instead of shapes.ejs
    let shapesArray = []
    for (let i=0; i< data.length; i +=1 ){
      // console.log(`type`, typeof shapesArray[0])
      let shape = String(data[i].SHAPE)
      shape = shape.replace(/ /g, "_");
      shape = shape.toUpperCase();
      shapesArray.push(shape)
    }
    shapesArray.sort()
    console.log(`shape array caps`, shapesArray)
    let shapeCounterObject = shapesArray.reduce(function (acc, curr) {
      return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
        }, {});
    console.log(shapeCounterObject)
    res.render(`shapes`, {shapeCounterObject})
  })
})

const getShape = (request, response) =>{
  console.log(`request came in`, request.body)
  read(`data.json`, (readErr, jsonContentObj) => {
    if(readErr){
      console.error(`ReadError`, readErr)
      response.send('ERROR')
    } else {
      console.log(request.params)
      let shape = request.params.shape
      console.log(`index`, typeof shape, shape)
      const sightingsMatchingShape = jsonContentObj.sightings.filter(element => (element.SHAPE.replace(/ /g, "_")).toUpperCase() === shape )
      // response.send(sightingsMatchingShape)
      console.log(sightingsMatchingShape)
      // response.send(`getting there`)
      response.render(`sightings_shape`,{sightingsMatchingShape})
    }
  })
}
app.get(`/shapes/:shape`, getShape)


const sortShapeByDate = (req, res) => {
  let sightingsMatchingShape = []
  read(`data.json`, (readErr, jsonContentObj) => {
    if (readErr) {
      console.error(`ReadError`, readErr)
      res.send(`Error Reading File`) 
    } 
    let shape=String(req.query.shape)
    // check if error is arising from the array sightingsMatchingShape
    try {
      sightingsMatchingShape = jsonContentObj.sightings.filter( e => String(e.SHAPE).replace(/ /g, "_").toUpperCase() === shape)
    } catch (exc) {
    }

    const ascFn = (a,b)=> new Date(a.DATE) - new Date(b.DATE)
    const descFn = (a,b)=> new Date(b.DATE) - new Date(a.DATE)

    // sorting condition
    sightingsMatchingShape.sort(
      req.query.sort === 'asc' ? ascFn : descFn
    );
    // console.log(`array of filter records matching shape`, sightingsMatchingShape)

    res.render(`sightings_shape`,{sightingsMatchingShape})
    // res.send("hello")
  })
}
app.get(`/shape-detail`, sortShapeByDate)

// method 1. sory listing by date only
// const sortSummarybyDate = (req, res) => {
//   let data = []
//   read(`data.json`, (readErr, jsonContentObj) => {
//     if (readErr) {
//       console.error(`ReadError`, readErr)
//       res.send(`Error Reading File`) 
//     } 
//   data = jsonContentObj.sightings  
//   const ascFn = (a,b)=> new Date(a.DATE) - new Date(b.DATE)
//   const descFn = (a,b)=> new Date(b.DATE) - new Date(a.DATE)
//   // sorting condition
//   data.sort(
//     req.params.sortHow === `asc` ? ascFn : descFn  
//   )  
    
//   res.render(`listing`, {data})
//   })
// }
// app.get(`/listings-sortDates/:sortHow`, sortSummarybyDate)

// method 2: better. sort listing by chosen parameter
const sortSummary = (req, res) => {
  let data = []
  read(`data.json`, (readErr, jsonContentObj) => {
    if (readErr) {
      console.error(`ReadError`, readErr)
      res.send(`Error Reading File`) 
    } 
  data = jsonContentObj.sightings  

  if (req.params.parameter==="dates") {
  const ascFn = (a,b)=> new Date(a.DATE) - new Date(b.DATE)
  const descFn = (a,b)=> new Date(b.DATE) - new Date(a.DATE)
  // sorting condition
  data.sort(
    req.params.sortHow === `asc` ? ascFn : descFn  
  )}
  res.render(`listing`, {data})
  })
}
app.get(`/listings-sortby/:parameter/:sortHow`, sortSummary)


app.listen(port)