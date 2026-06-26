import mongoose from 'mongoose'

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI manquante dans les variables d\'environnement')

  await mongoose.connect(uri)
  console.log('MongoDB connecté')

  mongoose.connection.on('error', (err) => {
    console.error('Erreur MongoDB :', err)
  })
}
