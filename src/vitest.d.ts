// tsconfig に types 配列を足すと @types/w3c-generic-sensor 等の ambient 型の
// 自動読み込みが止まるため、vitest の globals 型だけをここで追加する
/// <reference types="vitest/globals" />
