const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = []

const getUserByUsername = username => users.find(user => user.username === username)
const getUserTodoIndex = (user, todoId) => user.todos.findIndex((todo) => todo.id === todoId)

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers
  const user = getUserByUsername(username)
  if (!user) return response.status(403).json({ error: "You don't have permission to be here!" })
  request.user = user
  return next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body

  const userExists = getUserByUsername(username)
  if (userExists) return response.status(400).json({ error: 'User already exists.' })

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser)

  return response.status(201).json(newUser)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  return response.json(request.user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  const { user } = request

  if (!title) return response.status(400).json({ error: 'title is required.' })
  if (!deadline) return response.status(400).json({ error: 'deadline is required.' })

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(newTodo)
  return response.status(201).json(newTodo)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body

  const { user } = request
  const { id } = request.params
  const todoIndex = getUserTodoIndex(user, id)
  if (todoIndex < 0) return response.status(404).json({ error: 'Todo not found.' })

  user.todos[todoIndex] = {
    ...user.todos[todoIndex],
    ...(title && { title }),
    ...(deadline && { deadline })
  }

  return response.json(user.todos[todoIndex])
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { id } = request.params
  const todoIndex = getUserTodoIndex(user, id)
  if (todoIndex < 0) return response.status(404).json({ error: 'Todo not found.' })

  user.todos[todoIndex] = {
    ...user.todos[todoIndex],
    done: true
  }

  return response.json(user.todos[todoIndex])
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { id } = request.params
  const todoIndex = getUserTodoIndex(user, id)
  if (todoIndex < 0) return response.status(404).json({ error: 'Todo not found.' })

  const removedTodo = user.todos.splice(user.todos[todoIndex], 1)
  return response.status(204).json(removedTodo)
});

module.exports = app;