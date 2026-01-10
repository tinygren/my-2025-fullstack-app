require('dotenv').config()
const express = require('express')
const Note = require('./models/note')
const path = require('path')

const app = express()
//Koska middlewaret suoritetaan siinä järjestyksessä, missä ne on otettu käyttöön funktiolla app.use,
// on niiden määrittelyn kanssa oltava tarkkana.
// Serve static files from the built client (Vite output)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist')
app.use(express.static(clientDistPath))
app.use(express.json())

// Basic route

app.get('/', (request, response) => {
  response.send('<h1>Happy New Year From BackEnd !</h1>')
})

// API example
app.get('/api/hello', (request, response) => {
  response.json({ message: 'Hello from backend!' })
})
// app.get('/api/notes', (request, response) => {
//   response.json(notes)

// })
app.get('/api/notes', (request, response) => {
  Note.find({}).then(notes => {
    response.json(notes)
  })
})
/*
Jos findById-metodin palauttama promise päätyy rejected-tilaan,
kyselyyn vastataan statuskoodilla 500 Internal Server Error. Konsoliin tulostetaan tarkempi tieto virheestä.
Olemattoman muistiinpanon lisäksi koodista löytyy myös toinen virhetilanne, joka täytyy käsitellä.
Tässä virhetilanteessa muistiinpanoa yritetään hakea virheellisen muotoisella id:llä eli sellaisella, joka ei vastaa MongoDB:n id:iden muotoa.
Kun findById-metodi saa argumentikseen väärässä muodossa olevan id:n, se heittää virheen. Tästä seuraa se,
että metodin palauttama promise päätyy rejected-tilaan, jonka seurauksena catch-lohkossa määriteltyä funktiota kutsutaan.
*/
// app.get('/api/notes/:id', (request, response) => {
//   Note.findById(request.params.id)
//     .then(note => {
//       if (note) {
//         response.json(note)
//       } else {
//         response.status(404).end()
//       }
//     })
//     .catch(error => {
//       console.log(error)
//       response.status(400).send({ error: 'malformatted id' })
//     })
// })
/*Muutetaan routen /api/notes/:id käsittelijää siten, että se siirtää virhetilanteen käsittelyn eteenpäin funktiolla next,
 jonka se saa kolmantena parametrinaan:
 */
app.get('/api/notes/:id', (request, response, next) => {
  Note.findById(request.params.id)
    .then(note => {
      if (note) {
        response.json(note)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
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
  const { content, important } = request.body

  Note.findById(request.params.id)
    .then(note => {
      if (!note) {
        return response.status(404).end()
      }
      note.content = content       //päivitetään muistiinpanon tiedot
      note.important = important

      return note.save().then((updatedNote) => {   //tallennetaan päivitetty muistiinpano tietokantaan
        response.json(updatedNote)
      })
    })
    .catch(error => next(error))
})

// const generateId = () => {
//   const maxId = notes.length > 0
//     ? Math.max(...notes.map(n => Number(n.id)))
//     : 0
//   return String(maxId + 1)
// }

//Muutetaan nyt kaikki operaatiot tietokantaa käyttävään muotoon.
//Uuden muistiinpanon luominen tapahtuu seuraavasti:

app.post('/api/notes', (request, response, next) => {
  const body = request.body

  if (!body.content) {
    return response.status(400).json({ error: 'content missing' }) //400 Bad Request
  }
  const note = new Note({
    content: body.content,
    important: body.important || false,
  })

  note.save().then(savedNote => {
    response.json(savedNote)
  })
    .catch(error => next(error))

})

// Fallback to index.html for client-side routing
app.get(/.*/, (request, response) => {
  response.sendFile(path.join(clientDistPath, 'index.html'), err => {
    if (err) {
      response.status(500).send(err)
    }
  })
})
// Error handling middleware
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
// olemattomien osoitteiden käsittely
app.use(unknownEndpoint)

// virheellisten pyyntöjen käsittely
// app.use((error, request, response, next) => {
//   console.error(error.message)

//   if (error.name === 'CastError') {
//     return response.status(400).json({ error: 'malformatted id' })
//   } else if (error.name === 'ValidationError') {
//     return response.status(400).json({ error: error.message })
//   }

//   next(error)
// })
//    sama kuin ylempi
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })

  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}
// tämä tulee kaikkien muiden middlewarejen ja routejen rekisteröinnin jälkeen!
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})