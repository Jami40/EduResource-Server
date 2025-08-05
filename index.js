const express=require('express');
const app=express();
const cors=require('cors');
require('dotenv').config()
const port=process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.knxzg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const resourcesCollection = client.db("edudDb").collection("resources");
    const userCollection = client.db("edudDb").collection("users");

    app.get('/users', async (req, res) => {
    const users = await userCollection.find({}).toArray();
    res.send(users);
  });

    app.get('/users/:email', async (req, res) => {
       const email = req.params.email;
       const user = await userCollection.findOne({ email });
       if (!user) {
         return res.status(404).send({ message: 'User not found' });
       }
      res.send(user);
    });

    app.post('/users', async (req, res) => {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
            return res.send({ message: 'User already exists' });
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
    });
    
    // Create a new resource
    app.get('/resources', async (req, res) => {
        const request=await resourcesCollection.find().toArray();
        res.send(request);
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Edu resource running');

});

app.listen(port, () => {
    console.log(`Edu resource running on port ${port}`);
});