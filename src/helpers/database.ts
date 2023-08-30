import { FirebaseApp, initializeApp } from 'firebase/app';
import { Database, child, get, getDatabase, onChildAdded, ref, set } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { conf } from '../../config.js';

class DatabaseService {
  app: FirebaseApp
  db: Database
  initSkip = {}
  unsubscribe = []

  constructor() {
    try{
      this.app = initializeApp({
        ...conf.firebase
      })

      const auth = getAuth();
      signInWithEmailAndPassword(auth, conf.authFirebase.email, conf.authFirebase.password)
        .catch((error) => {
          console.log(error)
        })

      this.db = getDatabase(this.app);

    } catch(err) {
      console.error('Application works without database!!');
      console.error(err);
    }
  }

  getUsers(): Promise<Collection<User>> {
    return new Promise((resolve, reject) => {
      get(child(ref(this.db), 'users'))
        .then(snapshot => resolve(snapshot.val()))
        .catch(err => reject(err))
    })
  }

  setUserListner(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, 'users/' + user.id), user)
        .then(() => resolve())
        .catch(err => reject(err))
    })
  }

  async updateAdsThread(key: string, cb): Promise<void> {
      this.initSkip[key] = true
      const unsubscribe =  onChildAdded(ref(this.db, 'ads/' + key), (snapshot) => {
      const data: Collection<Ad> = snapshot.val()

      setTimeout(() => {
        this.initSkip[key] = false
      }, 0);

      if(this.initSkip[key]) {
        return
      }
      cb(data)
    })
    this.unsubscribe.push(unsubscribe)
  }

  getAllAdsThread(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.unsubscribe.forEach(unsubscribe => unsubscribe())
      get(child(ref(this.db), 'ads'))
        .then((snapshot) => {
          const val = snapshot.val()
          return resolve(Object.keys(val))
        })
        .catch(err => reject(err))
    })
  }

  async updateAds(cb): Promise<void> {
   onChildAdded(ref(this.db, 'ads'), async () => {
    const keys = await this.getAllAdsThread()

    for(const key of keys){
      console.log(key)
      this.updateAdsThread(key, cb)
      
    }

   })
  }  
 
}

const db = new DatabaseService();
export default db;

export interface Collection<T> {
  [key: string]: T
}

export interface User {
  id: string,
  is_bot: boolean,
  first_name: string,
  username: string
}

export interface Ad {
  id: string,
  title: string,
  url: string
}