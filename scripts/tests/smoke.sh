#!/bin/bash

# 冒煙測試腳本

# 每日穿搭推薦儲存
curl -X POST http://localhost:3000/api/reco/daily-outfits/save \
     -H "Content-Type: application/json" \
     -d '{"userId":"test-user","recommendations":[{"outfit":{"top":{"id":"1","userId":"test-user","name":"T-Shirt","category":"top","style":"casual","tags":["white"],"imageUrl":"","createdAt":"2023-01-01T00:00:00.000Z","updatedAt":"2023-01-01T00:00:00.000Z"},"bottom":{"id":"2","userId":"test-user","name":"Jeans","category":"bottom","style":"casual","tags":["blue"],"imageUrl":"","createdAt":"2023-01-01T00:00:00.000Z","updatedAt":"2023-01-01T00:00:00.000Z"},"shoes":{"id":"3","userId":"test-user","name":"Sneakers","category":"shoes","style":"casual","tags":["white"],"imageUrl":"","createdAt":"2023-01-01T00:00:00.000Z","updatedAt":"2023-01-01T00:00:00.000Z"}},"reasons":["Good for current weather"],"scores":{"weatherFit":1,"occasionMatch":1,"compatibility":1,"total":3}}],"timestamp":"2023-01-01T00:00:00.000Z"}'

# 購物車混搭推薦儲存
curl -X POST http://localhost:3000/api/reco/basket-mixmatch/save \
     -H "Content-Type: application/json" \
     -d '{"userId":"test-user","recommendations":[{"outfit":{"top":{"id":"1","userId":"test-user","name":"T-Shirt","category":"top","style":"casual","tags":["white"],"imageUrl":"","createdAt":"2023-01-01T00:00:00.000Z","updatedAt":"2023-01-01T00:00:00.000Z"},"bottom":{"id":"2","userId":"test-user","name":"Jeans","category":"bottom","style":"casual","tags":["blue"],"imageUrl":"","createdAt":"2023-01-01T00:00:00.000Z","updatedAt":"2023-01-01T00:00:00.000Z"},"shoes":{"id":"3","userId":"test-user","name":"Sneakers","category":"shoes","style":"casual","tags":["white"],"imageUrl":"","createdAt":"2023-01-01T00:00:00.000Z","updatedAt":"2023-01-01T00:00:00.000Z"}},"reasons":["Great outfit"],"scores":{"compatibility":1,"rules":{},"total":1}}],"timestamp":"2023-01-01T00:00:00.000Z"}'

# 衣櫥空缺填補推薦儲存
curl -X POST http://localhost:3000/api/reco/closet-gap-fill/save \
     -H "Content-Type: application/json" \
     -d '{"userId":"test-user","recommendations":[{"item":{"id":"101","name":"Classic White Sneakers","category":"shoes","style":"casual","imageUrl":"","price":80},"reason":"You need shoes","score":1,"unlockCount":1,"examplePairings":[]}],"timestamp":"2023-01-01T00:00:00.000Z"}'
