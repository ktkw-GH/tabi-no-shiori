// Firebaseの接続設定
// ここに書かれている値は、Kataさんのfirebase-consoleの「プロジェクトの設定」→「マイアプリ」に
// 表示されていた firebaseConfig の内容そのものです。
// これは「このFirebaseプロジェクトの住所」のようなもので、他人に公開しても即座に危険という
// ものではありませんが、基本的には自分の環境にだけ置いておくものです。

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDZj86JjyXiCtrrCZ4cO1YmRVaKUtYDjw0",
  authDomain: "trip-planner-833b0.firebaseapp.com",
  projectId: "trip-planner-833b0",
  storageBucket: "trip-planner-833b0.firebasestorage.app",
  messagingSenderId: "561896304754",
  appId: "1:561896304754:web:a600108932d4917db5d2eb",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
