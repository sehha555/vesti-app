// test-lmstudio.js (本地伺服器最終版)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // 我們仍然需要它來確保連線穩定

async function testLMStudioAPI() {
  console.log('🚀 開始測試本地 LM Studio API...');

  // LM Studio 預設的伺服器地址
  const apiEndpoint = 'http://localhost:1234/v1/chat/completions';

  // 準備圖片
  const imagePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'apps', 'web', 'public', 'test-image.jpg');
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ 錯誤: 找不到測試圖片，請確認它位於: ${imagePath}`);
    return;
  }
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const imageUrl = `data:image/jpeg;base64,${base64Image}`;

  console.log('✅ 本地設定檢查完畢！');
  console.log(`⏳ 正在呼叫本地 API: ${apiEndpoint}`);

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'loaded-model', // 在 LM Studio 中，這個值會被忽略
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageUrl } },
              { type: 'text', text: '請以繁體中文、JSON格式分析這張圖片中的服飾，包含以下key：type, color, style, material, occasion。' }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 回應錯誤: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('\n🎉🎉🎉 恭喜！本地模型呼叫成功！🎉🎉🎉');
    console.log('🤖 LM Studio Qwen-VL 分析結果:');
    
    const content = result.choices[0].message.content;
    console.log(content);
    
  } catch (error) {
    console.error('\n❌ 失敗:', error.message);
    if (error.code === 'ECONNREFUSED') {
        console.error('💡 提示: 連線被拒絕。請返回 LM Studio，確認你已經點擊了 "Start Server" 按鈕！');
    }
  }
}

testLMStudioAPI();

