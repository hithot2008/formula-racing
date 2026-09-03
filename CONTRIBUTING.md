<!-- 此檔由雙語來源產生；請同時修改兩種語言。 Source: docs/source/CONTRIBUTING.json -->

# 貢獻與雙語維護

[English](CONTRIBUTING.en.md)

<!-- section: section-00 -->

中英文版本必須具有相同功能與說明細項。英文文件不能只是中文版摘要；未實作項目、風險、操作與驗證限制也必須對等。

<!-- section: section-01 -->

## 更新流程

- 同一提交中更新中英文介面、功能說明、操作、版本限制及相關驗證紀錄。
- 使用相同遊戲程式、設定鍵與存檔結構；不要以語言切換改變物理或玩法。
- 在 `src/i18n.js` 維護英文翻譯；新增動態訊息、音樂或賽道時一起核對字典。
- 編輯 `docs/source/*.json`，每個章節都同時維護 `zh` 與 `en`，保留共用章節 ID。
- 不直接編輯產生的 Markdown。執行產生器後檢視兩種語言的差異與 GitHub 呈現。
- 人工比對每項事實、條件、限制及語意；自動結構检查不能取代翻譯審查。

<!-- section: section-02 -->

## 必要指令

```sh
npm run docs:generate
npm run docs:check
npm test
npm run build
```

修改遊戲介面或操作後，在開發伺服器運行時執行相關瀏覽器檢查：

```sh
npm run test:browser
npm run test:english
npm run test:steering
npm run test:music
```

<!-- section: section-03 -->

## 自動檢查與邊界

檢查會拒絕缺少語言、空白章節、清單／表格結構差異、指令區塊差異、數值差異、失效的本機文件連結與過期產生檔。GitHub CI 執行文件檢查及既有測試／建置。

兩邊即使結構相同，也可能翻譯不準或同時缺少一項功能。維護者仍須依程式實作逐項審查；不要透過刪除檢查或縮短另一語言的內容來讓檢查通過。

<!-- section: renders -->

## 提交時更新渲染圖

每次 GitHub 提交前，執行 `npm run render:images` 重新產生中英文桌面、手機、選取特效、音樂設定、比賽與結算截圖，再執行 `npm run render:check`。將 `artifacts/` 的圖片與 `render-manifest.json` 隨程式一併提交。

產生器使用獨立本機連接埠 4175，完成後自動關閉。它也驗證滑鼠／鍵盤選取、設定回饋與減少動態效果。一般瀏覽器測試的暫存圖片寫入忽略追蹤的 `artifacts/test-runs/`，不覆寫正式渲染圖。

CI 會核對渲染輸入與圖片雜湊；程式或正式截圖改動但未重新產生時會失敗。這項檢查不能取代人工視覺檢視。
