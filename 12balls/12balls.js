
            var  i,j;
            var SolutionNum = 1 ;
            var Position = ["空","左","右"];
            var Result1 = [ "平", "左", "右" ];
            var Result2 = [ "平", "右", "左" ];
            var Image = [ 0,2,1,6,8,7,3,5,4,18,20,19,24,26,25,21,23,22,9,11,10,15,17,16,12,14,13];
            var Place =  new Array(27);
            var Ball =  new Array(12);
            var B = new Array(3).fill(0).map(() => new Array(27).fill(0));;
            var BallNum = 0;
            var PlaceNum = 1;
            var Balance = true;
            var PrintBuffer;

            for (i = 0; i < 27; i++)
            {
                B[0][i] = i % 3;
                B[1][i] = ((i - B[0][i]) / 3) % 3;
                B[2][i] = ((i - B[0][i] - B[1][i] * 3) / 9) % 3;
            }

            for (i = 0; i < 27; i++)
                Place[i] = 0;

            while (BallNum >= 0)
            {
                while (PlaceNum < 27 && Place[PlaceNum] != 0 )
                {
                    PlaceNum++;
                }
 
                if(PlaceNum < 27)
                {
                    //find a empty place
                    Ball[BallNum] = PlaceNum;

                    Place[PlaceNum] = 1;
                    Place[Image[PlaceNum]] = 2;

                    if (BallNum < 11)
                    {
                        // continue
                        BallNum++;
                    }
                    else
                    {
                        //the last ball, the solution finished!
                        Balance = true;
                        PrintBuffer = "";

                        for (i = 0; i < 3; i++)
                        {
                            var Left, Right, Free;
                            var LCnt, RCnt;

                            Left = "";
                            Right = "";
                            Free = "";

                            LCnt = 0;
                            RCnt = 0;

                            for (j = 0; j < 12; j++)
                            {

                                    switch (B[i, Ball[j]])
                                    {
                                        case 0:
                                            Free += (j+1).toString() + " ";
                                            break;
                                        case 1:
                                            Left += (j+1).toString() + " ";
                                            LCnt++;
                                            break;
                                        case 2:
                                            Right += (j+1).toString() + " ";
                                            RCnt++;
                                            break;
                                    }
                            }

                            PrintBuffer += "第"+(i+1).toString()+"次称重，左边："+Left+"右边："+Right+"，空闲："+Free+"\r\n";


                            if (LCnt != RCnt)
                            {
                                Balance = false;
                            }

                        }

                        if (Balance)
                        {
                            console.log("第%d套方案：\r\n", SolutionNum++);
                            console.log(PrintBuffer);

                            PrintBuffer = "";

                            for (var k = 0; k < 12; k++)
                            {
                                PrintBuffer += (k+1).toString()+"号球重："+Result1[B[0, Ball[k]]]+Result1[B[1, Ball[k]]]+Result1[B[2, Ball[k]]]+".\r\n";
                                PrintBuffer += (k+1).toString()+"号球轻："+Result2[B[0, Ball[k]]]+Result2[B[1, Ball[k]]]+Result2[B[2, Ball[k]]]+".\r\n";
                            }
                            console.log(PrintBuffer);
                        }

                        Place[PlaceNum] = 0;
                        Place[Image[PlaceNum]] = 0;
                        PlaceNum++;
                    }
                }
                else
                {
                    BallNum--;
                    if (BallNum >= 0)
                    {
                        PlaceNum = Ball[BallNum];

                        Place[PlaceNum] = 0;
                        Place[Image[PlaceNum]] = 0;
                        PlaceNum++;

                        Ball[BallNum] = 0;
                    }

                }
            }
