import { Client, Model } from './src/index.js';

  const client = new Client('g.a0004gi2eQNpFuJeYtPnZ7Fo0V6X-XQdNlJ...', 'AKEyXzWOveN-HIi799X9splZO0lfuGLD5LXnCi3Pc8uttdK1eC5IkxJYx9WHt99tOYvtuOf_EPY');

  await client.init();

  const a = await client.ask('حلل هذا', ['https://scontent.xx.fbcdn.net/v/t15.3394-10/601218350_32811101325202489_2019767424402412378_n.jpg?stp=dst-jpg_s640x640_tt6&_nc_cat=105&ccb=1-7&_nc_sid=56d81d&_nc_ohc=7iyFplFTr60Q7kNvwENyQ6b&_nc_oc=AdlFehbkSkEYzWuYLLQsCCJldJ3W_yvSsUGNgVsBMhsEE_7nQGvcYQA9cwwPgbajZNw&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.xx&_nc_gid=Ngg-Jpb2Xgep7XsfQeIXFQ&oh=03_Q7cD4AHCLBfSgqy2V8hZysbXnNjsD1MVjRPeJxo2cwenMLa2kw&oe=69485588']);

  console.log(a);