const express=require('express');
const app=express();
const cors=require('cors');
require('dotenv').config()
const port=process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const requestsCollection = client.db("edudDb").collection("requests");
    const notificationsCollection = client.db("edudDb").collection("notifications");

    // Get all users
    // app.get('/users', async (req, res) => {
    //   try {
    //     const users = await userCollection.find({}).toArray();
    //     res.send(users);
    //   } catch (error) {
    //     console.error('Error fetching users:', error);
    //     res.status(500).send({ message: 'Internal server error' });
    //   }
    // });

    // Get user by email
    // app.get('/users/:email', async (req, res) => {
    //   try {
    //     const email = req.params.email;
    //     const user = await userCollection.findOne({ email });
    //     if (!user) {
    //       return res.status(404).send({ message: 'User not found' });
    //     }
    //     res.send(user);
    //   } catch (error) {
    //     console.error('Error fetching user:', error);
    //     res.status(500).send({ message: 'Internal server error' });
    //   }
    // });

    // Update user profile
    app.patch('/users/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const updates = req.body;
        const result = await userCollection.updateOne(
          { email: email },
          { $set: updates }
        );
        if (result.modifiedCount > 0) {
          res.send({ message: 'User updated successfully' });
        } else {
          res.status(404).send({ message: 'User not found' });
        }
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Create new user
    // app.post('/users', async (req, res) => {
    //   try {
    //     const user = req.body;
    //     const query = { email: user.email };
    //     const existingUser = await userCollection.findOne(query);
    //     if (existingUser) {
    //       return res.send({ message: 'User already exists' });
    //     }
    //     const result = await userCollection.insertOne(user);
    //     res.send(result);
    //   } catch (error) {
    //     console.error('Error creating user:', error);
    //     res.status(500).send({ message: 'Internal server error' });
    //   }
    // });

    // Get all resources
    // app.get('/resources', async (req, res) => {
    //   try {
    //     const resources = await resourcesCollection.find().toArray();
    //     res.send(resources);
    //   } catch (error) {
    //     console.error('Error fetching resources:', error);
    //     res.status(500).send({ message: 'Internal server error' });
    //   }
    // });

    // Create new resource (Admin only)
    // app.post('/resources', async (req, res) => {
    //   try {
    //     const resource = req.body;
    //     const result = await resourcesCollection.insertOne(resource);
    //     res.send(result);
    //   } catch (error) {
    //     console.error('Error creating resource:', error);
    //     res.status(500).send({ message: 'Internal server error' });
    //   }
    // });

    // Update resource (Admin only)
    // app.put('/resources/:id', async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     const updates = req.body;
    //     const result = await resourcesCollection.updateOne(
    //       { _id: new ObjectId(id) },
    //       { $set: updates }
    //     );
    //     if (result.modifiedCount > 0) {
    //       res.send({ message: 'Resource updated successfully' });
    //     } else {
    //       res.status(404).send({ message: 'Resource not found' });
    //     }
    //   } catch (error) {
    //     console.error('Error updating resource:', error);
    //     res.status(500).send({ message: 'Internal server error' });
    //   }
    // });

    // Delete resource (Admin only)
    // app.delete('/resources/:id', async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     const result = await resourcesCollection.deleteOne({ _id: new ObjectId(id) });
    //     if (result.deletedCount > 0) {
    //       res.send({ message: 'Resource deleted successfully' });
    //     } else {
    //       res.status(404).send({ message: 'Resource not found' });
    //     }
    //   } catch (error) {
    //     console.error('Error deleting resource:', error);
    //     res.status(500).send({ message: 'Internal server error' });
    //   }
    // });

    // Create or update user (upsert for Google sign-in)
app.post('/users', async (req, res) => {
  try {
    const user = req.body;
    const query = { email: user.email };
    const update = {
      $set: {
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        uid: user.uid,
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        createdAt: user.createdAt || new Date().toISOString(),
      }
    };
    const options = { upsert: true };
    const result = await userCollection.updateOne(query, update, options);
    if (result.upsertedCount > 0) {
      res.send({ message: 'User created' });
    } else if (result.modifiedCount > 0) {
      res.send({ message: 'User updated' });
    } else {
      res.send({ message: 'User already exists' });
    }
  } catch (error) {
    console.error('Error upserting user:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Update user profile (PATCH)
app.patch('/users/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const updates = req.body;
    if (updates.photoURL || updates.displayName) {
      updates.updatedAt = new Date().toISOString();
    }
    const result = await userCollection.updateOne(
      { email: email },
      { $set: updates }
    );
    if (result.modifiedCount > 0) {
      res.send({ message: 'User updated successfully' });
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Get user by email (always return latest photoURL/displayName)
app.get('/users/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = await userCollection.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    // Always return displayName and photoURL
    res.send({
      ...user,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

    // Get usage history for specific user
    app.get('/api/usage-history/user/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const history = await requestsCollection.find({ userEmail: email }).sort({ requestDate: -1 }).toArray();
        res.send(history);
      } catch (error) {
        console.error('Error fetching user usage history:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    app.get('/api/overdue-items/user/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const today = new Date();
        const overdueItems = await requestsCollection.find({
          userEmail: email,
          status: 'approved',
          dueDate: { $lt: today.toISOString() },
          returnedAt: { $exists: false }
        }).toArray();
        res.send(overdueItems);
      } catch (error) {
        console.error('Error fetching user overdue items:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Get all requests
    app.get('/api/requests', async (req, res) => {
      try {
        const requests = await requestsCollection.find({}).toArray();
        res.send(requests);
      } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Get requests by user email
    app.get('/api/requests/user/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const requests = await requestsCollection.find({ userEmail: email }).toArray();
        res.send(requests);
      } catch (error) {
        console.error('Error fetching user requests:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Create new request
    app.post('/api/requests', async (req, res) => {
      try {
        const request = req.body;
        const result = await requestsCollection.insertOne(request);
        res.send(result);
      } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Update request status (Admin only)
    app.patch('/api/requests/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updates = req.body;
        
        // If approving, add due date if not provided
        if (updates.status === 'approved' && !updates.dueDate) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 14); // Default 14 days
          updates.dueDate = dueDate.toISOString();
        }

        const result = await requestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updates }
        );
        if (result.modifiedCount > 0) {
          res.send({ message: 'Request updated successfully' });
        } else {
          res.status(404).send({ message: 'Request not found' });
        }
      } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Mark item as returned
    app.patch('/api/requests/:id/return', async (req, res) => {
      try {
        const id = req.params.id;
        const updates = req.body;
        updates.status = 'returned';
        
        const result = await requestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updates }
        );
        if (result.modifiedCount > 0) {
          res.send({ message: 'Item marked as returned successfully' });
        } else {
          res.status(404).send({ message: 'Request not found' });
        }
      } catch (error) {
        console.error('Error marking item as returned:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Get usage history
    app.get('/api/usage-history', async (req, res) => {
      try {
        const history = await requestsCollection.find({}).sort({ requestDate: -1 }).toArray();
        res.send(history);
      } catch (error) {
        console.error('Error fetching usage history:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Get overdue items
    app.get('/api/overdue-items', async (req, res) => {
      try {
        const today = new Date();
        const overdueItems = await requestsCollection.find({
          status: 'approved',
          dueDate: { $lt: today.toISOString() },
          returnedAt: { $exists: false }
        }).toArray();
        res.send(overdueItems);
      } catch (error) {
        console.error('Error fetching overdue items:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Send notification
    app.post('/api/notifications', async (req, res) => {
      try {
        const notification = req.body;
        const result = await notificationsCollection.insertOne(notification);
        res.send(result);
      } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Get notifications for user
    app.get('/api/notifications/user/:userId', async (req, res) => {
      try {
        const userId = req.params.userId;
        const notifications = await notificationsCollection.find({ userId }).sort({ sentAt: -1 }).toArray();
        res.send(notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    // Get dashboard statistics
    app.get('/api/dashboard-stats', async (req, res) => {
      try {
        const totalResources = await resourcesCollection.countDocuments();
        const pendingRequests = await requestsCollection.countDocuments({ status: 'pending' });
        const activeLoans = await requestsCollection.countDocuments({ 
          status: 'approved', 
          returnedAt: { $exists: false } 
        });
        
        const today = new Date();
        const overdueItems = await requestsCollection.countDocuments({
          status: 'approved',
          dueDate: { $lt: today.toISOString() },
          returnedAt: { $exists: false }
        });

        res.send({
          totalResources,
          pendingRequests,
          activeLoans,
          overdueItems
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });


    // Replace your current /users endpoint
app.get('/users', async (req, res) => {
  try {
    const users = await userCollection.find({}).toArray();
    res.send(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Replace your current /users/:email endpoint
app.get('/users/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = await userCollection.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    res.send(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Replace your current PATCH /users/:email endpoint
app.patch('/users/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const updates = req.body;
    const result = await userCollection.updateOne(
      { email: email },
      { $set: updates }
    );
    if (result.modifiedCount > 0) {
      res.send({ message: 'User updated successfully' });
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Replace your current POST /users endpoint
app.post('/users', async (req, res) => {
  try {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await userCollection.findOne(query);
    if (existingUser) {
      return res.send({ message: 'User already exists' });
    }
    const result = await userCollection.insertOne(user);
    res.send(result);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Replace your current /resources endpoint
app.get('/resources', async (req, res) => {
  try {
    const resources = await resourcesCollection.find().toArray();
    res.send(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Replace your current POST /resources endpoint
app.post('/resources', async (req, res) => {
  try {
    const resource = req.body;
    const result = await resourcesCollection.insertOne(resource);
    res.send(result);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Replace your current PUT /resources/:id endpoint
app.put('/resources/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const result = await resourcesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    if (result.modifiedCount > 0) {
      res.send({ message: 'Resource updated successfully' });
    } else {
      res.status(404).send({ message: 'Resource not found' });
    }
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Replace your current DELETE /resources/:id endpoint
app.delete('/resources/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await resourcesCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount > 0) {
      res.send({ message: 'Resource deleted successfully' });
    } else {
      res.status(404).send({ message: 'Resource not found' });
    }
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Replace your current GET /api/requests endpoint
app.get('/api/requests', async (req, res) => {
  try {
    const requests = await requestsCollection.find({}).toArray();
    res.send(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Replace your current GET /api/requests/user/:email endpoint
app.get('/api/requests/user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const requests = await requestsCollection.find({ userEmail: email }).toArray();
    res.send(requests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Replace your current POST /api/requests endpoint
app.post('/api/requests', async (req, res) => {
  try {
    const request = req.body;
    const result = await requestsCollection.insertOne(request);
    res.send(result);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Replace your current PATCH /api/requests/:id endpoint
app.patch('/api/requests/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const result = await requestsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    if (result.modifiedCount > 0) {
      res.send({ message: 'Request updated successfully' });
    } else {
      res.status(404).send({ message: 'Request not found' });
    }
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

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