const express = require('express')
const app = express()
const cors = require('cors')
const jwt= require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
require('dotenv').config()

// middel wares
app.use(cors())
app.use(express.json())

console.log(process.env.USER_DB);


const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.DB_PASSWORD}@cluster0.sayatpw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}
async function run() {

    try {
     const productCollection = client.db('repliq').collection('product')
     const cartsCollection = client.db('repliq').collection('carts')
    const usersCollection=client.db('repliq').collection('users')

     const verifyAdmin = async (req, res, next) => {
        console.log(req.decoded.email);
        const decodedEmail = req.decoded.email
        const query = { email: decodedEmail }
        const user = await usersCollection.findOne(query)
  
        if (user?.role !== 'admin') {
          return res.status(403).send({ message: 'forbidden acess' })
        }
  
        next()
      }
        app.get('/products', async (req, res) => {
            const quary = {}
            const result = await productCollection.find(quary).toArray()
            res.send(result)
        })
        app.post('/products', async(req, res)=>{
            const quary=req.body
            const result= await productCollection.insertOne(quary)
            res.send(result)
        })


        app.get('/products/:id', async(req, res)=>{
            const id =req.params.id
            const quary={_id:ObjectId(id)}
            const result= await productCollection.findOne(quary)
            res.send(result)
        })
        // jwt====
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
         console.log(user);
         if (user) {
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '24h' })
            return res.send({ accessToken: token });
        }
        res.status(403).send({ accessToken: '' })
        });


        app.post('/carts', async(req, res)=>{
           const quary=req.body
           const result= await cartsCollection.insertOne(quary)
           res.send(result)
        })
        
        app.get('/cart', async(req, res)=>{
            let quary={}
            if(req.query.email){
                quary={
                    email:req.query.email
                }
            }
            const result= await cartsCollection.find(quary).toArray()
            res.send(result)
        })
         
        app.delete('/cart/:id', async(req, res)=>{
            const id=req.params.id
           const quary={_id:ObjectId(id)}
           const result= await cartsCollection.deleteOne(quary)
           res.send(result)
 })
        //   ===make admin====
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const query = { email }
            const user = await usersCollection.findOne(query)
            res.send({ isAdmin: user?.role === 'admin' })
          })

          app.get('/users', async (req, res) => {
            const query = {}
            const result = await usersCollection.find(query).toArray()
            res.send(result)
          })

    app.put('/users/admin/:id',  verifyAdmin, async (req, res) => {
      const id = req.params.id
      const filter = { _id: ObjectId(id) }
      const option = { upsert: true }
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await productCollection.updateOne(filter, updateDoc, option)
      res.send(result)

    })

//   ===user ====
         app.post('/users', async(req, res)=>{
            const quary=req.body
            const result = await usersCollection.insertOne(quary)
            res.send(result)
         })


    }
    finally {

    }

}
run().catch(e => {
    console.log(e);
})










app.get('/', async (req, res) => {
    res.send('hello sir')
})









app.listen(port, () => {
    console.log(port, `${'server running'}`);
})