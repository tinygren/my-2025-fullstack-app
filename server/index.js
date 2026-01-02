require('dotenv').config()
const express = require('express')
const Note = require('./models/note')
const path = require('path')

const app = express()

app.use(express.json())

// Serve static files from the built client (Vite output)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist')
app.use(express.static(clientDistPath))


// MONGODB connection code moved to models/note.js
// const mongoose = require('mongoose')
// if (process.argv.length < 3) {
//   console.log('give password as argument')
//   process.exit(1)
// }


// // ÄLÄ KOSKAAN TALLETA SALASANOJA GitHubiin!                         // timonygren_db_user       id878gbrVQY6HsVZ
// const password = process.argv[2]
// const url = `mongodb+srv://timonygren_db_user:${password}@cluster0.hpoizdi.mongodb.net/noteApp?appName=Cluster0`

// mongoose.set('strictQuery',false)
// mongoose.connect(url, { family: 4 })

// const noteSchema = new mongoose.Schema({
//   content: String,
//   important: Boolean,
// })

// noteSchema.set('toJSON', {
//   transform: (document, returnedObject) => {
//     returnedObject.id = returnedObject._id.toString()
//     delete returnedObject._id
//     delete returnedObject.__v
//   }
// })

// const Note = mongoose.model('Note', noteSchema)

// Dummy data before database integration
// let notes = [
//   {
//     id: "1",
//     content: "HTML is easy",
//     important: true
//   },
//   {
//     id: "2",
//     content: "Browser can execute only JavaScript",
//     important: false
//   },
//   {
//     id: "3",
//     content: "GET and POST are the most important methods of HTTP protocol",
//     important: true
//   },
//   {    id: "4",
//     content: "This is a new note",
//     important: false
//   }]

app.get('/', (request, response) => {
  response.send('<h1>Happy New Year From BackEnd !</h1>')
})

// API example
app.get("/api/hello", (request, response) => {
  response.json({ message: "Hello from backend!" });
});
// app.get('/api/notes', (request, response) => {
//   response.json(notes)
 
// })
app.get('/api/notes', (request, response) => {
  Note.find({}).then(notes => {
    response.json(notes)
  })
})

app.get('/api/notes/:id', (request, response) => {
  Note.findById(request.params.id).then(note => {
    response.json(note)
  })
})

app.delete('/api/notes/:id', (request, response, next) => {
  Note.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()  // No Content , the server successfully processed the request, but is not returning any content.
      console.log(`Note with id ${request.params.id} deleted`)
    })
    .catch(error => next(error))
})

app.put('/api/notes/:id', (request, response, next) => {
  const body = request.body

  const note = {
    content: body.content,
    important: body.important,
  }

  Note.findByIdAndUpdate(request.params.id, note, { new: true })
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => next(error))
})

// vanhaa koodia (ilman tietokantaa Mongodb)
// app.get('/api/notes/:id', (request, response) => {
//   const id = request.params.id
//   const note = notes.find(note => note.id === id)
  
//   if (note) {
//     response.json(note)
//   } else {
//     response.status(404).end()
//   }
// })
// app.delete('/api/notes/:id', (request, response) => {
//   const id = request.params.id
//   notes = notes.filter(note => note.id !== id)
//   response.status(204).end()
// })
const generateId = () => {
  const maxId = notes.length > 0
    ? Math.max(...notes.map(n => Number(n.id)))
    : 0
  return String(maxId + 1)
}

//Muutetaan nyt kaikki operaatiot tietokantaa käyttävään muotoon.
//Uuden muistiinpanon luominen tapahtuu seuraavasti:

app.post('/api/notes', (request, response) => {
  const body = request.body

  if (!body.content) {
    return response.status(400).json({ error: 'content missing' })
  }
  const note = new Note({
    content: body.content,
    important: body.important || false,
  })

  note.save().then(savedNote => {
    response.json(savedNote)
  })
  // vanhaa muotoa ei enää käytetä
  // const note = {
  //   content: body.content,
  //   important: body.important || false,
  //   id: generateId(),
  // }
  // notes = notes.concat(note)
  // response.json(notes)
})

// Fallback to index.html for client-side routing
app.get(/.*/, (request, response) => {
  response.sendFile(path.join(clientDistPath, 'index.html'), err => {
    if (err) {
      res.status(500).send(err)
    }
  })
})

app.use((error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).json({ error: 'malformatted id' })
  }
  next(error)
})

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})