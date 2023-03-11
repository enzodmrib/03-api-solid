import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users.repository'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserAlreadyExistsError } from '../use-cases/errors/user-already-exists-error'
import { RegisterUseCase } from '../use-cases/register'

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const registerBodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
  })

  const { name, email, password } = registerBodySchema.parse(request.body)

  try {
    /**
     * dependency inversion principle *
     * An external instantiation of the dependency
     * (in this case, the database connection) is created
     * and the code logic is dealt in the same way for every
     * type of db
     */
    const usersRepository = new PrismaUsersRepository() // dependency instantiation
    const registerUseCase = new RegisterUseCase(usersRepository) // dependency is passed as parameter (inversion)

    await registerUseCase.execute({
      name,
      email,
      password,
    })
  } catch (err) {
    if (err instanceof UserAlreadyExistsError) {
      return reply.status(409).send({ message: err.message })
    }

    throw err
  }

  return reply.status(201).send()
}
