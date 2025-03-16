import { getAllUsers, createUser } from '../../services/userService'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const users = await getAllUsers()
    res.json(users)
  } else if (req.method === 'POST') {
    const user = await createUser(req.body)
    res.status(201).json(user)
  }
}
