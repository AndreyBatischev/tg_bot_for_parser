import { FirebaseApp, initializeApp } from 'firebase/app';
import { Database, child, get, getDatabase, onChildAdded, ref, set } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { conf } from '../../config.js';

class DatabaseService {
  app: FirebaseApp
  db: Database
  initSkip = true

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

  async updateAds(cd): Promise<void> {
    onChildAdded(ref(this.db, 'ads'), (snapshot) => {
      const data: Collection<Ad> = snapshot.val()

  setTimeout(() => {
    this.initSkip = false
  }, 0);

  if(this.initSkip) {
    return
  }
  cd(data)

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