import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBmpY8czgh0p4oSN2ijMyM8-gbz9sYEb3s',
  authDomain: 'pcrapidchecker-9cd53.firebaseapp.com',
  projectId: 'pcrapidchecker-9cd53',
  storageBucket: 'pcrapidchecker-9cd53.firebasestorage.app',
  messagingSenderId: '408074082338',
  appId: '1:408074082338:web:629b74edbbf55bfd56d27b',
  measurementId: 'G-41LVM51YLC',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

export default app
