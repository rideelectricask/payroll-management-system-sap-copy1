import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBnxo4JK37Cx1qvwOADvhs79uLsXmsjwpc",
  authDomain: "disco-beach-391702.firebaseapp.com",
  projectId: "disco-beach-391702",
  storageBucket: "disco-beach-391702.appspot.com",
  messagingSenderId: "987911131909",
  appId: "1:987911131909:web:33d1b474c6241af7d41d6c"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
