import prisma from "./lib/prisma";

export default async function Home() {


  // const promise1 = new Promise((resolve, reject) => {

  //   const answer = true;
  //   if (answer) {
  //     resolve("completed true");
  //   } else {
  //     reject("completed false");
  //   }
  // });
  //  console.log(promise1);
  // promise1.then((result) => {
  //   console.log(result);
  // })

  const data = await prisma.sms_schedules.findMany();
  return (
    <div>
      {data.map((item) => (
        <div key={item.id}>
          <p>{item.sms_sender}</p>
          <p>{item.sms_text}</p>
        </div>
      ))}
    </div>
  );
}
