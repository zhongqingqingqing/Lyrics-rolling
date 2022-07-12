//放在一个立即执行函数中，避免污染全局
(async function () {
  /**
   * 从网络获取歌词数据
   * @returns Promise
   */
  async function getLrc() {
    return await fetch("https://study.duyiedu.com/api/lyrics")
      .then((resp) => resp.json())
      .then((resp) => resp.data);
  }

  // 获取需要操作得各种DOM元素
  const doms = {
    ul: document.querySelector(".lrc"),
    audio: document.querySelector("audio"),
  };

  //设置li元素的高度，container的高度
  const size = {
    liHeight: 30,
    containerHeight: 420,
  };

  //歌词数据
  let lrcData;

  /**初始化*/
  async function init() {
    //获得歌词
    const lrc = await getLrc();

    //将歌词字符串转换成[{time:80.90,words:'凭这两眼与百臂或千手不能防'}……]这种格式(每句歌词对应一个对象)
    /**
     * 1、以换行符分割字符串（变成伪数组）
     * 2、去除空白字符
     * 3、映射，得到歌词数组
     */
    lrcData = lrc
      .split("\n")
      .filter((s) => s)
      .map((s) => {
        // 分开时间和歌词
        const parts = s.split("]");
        // 得到时间字符串,以:分割,分别得到分，秒
        const timeParts = parts[0].replace("[", "").split(":");

        // 伪数组中每一个,对应返回一个对象
        return {
          time: +timeParts[0] * 60 + +timeParts[1],
          words: parts[1],
        };
      });

    //每句歌词生成一个li元素，加入ul中
    doms.ul.innerHTML = lrcData.map((lrc) => `<li>${lrc.words}</li>`).join("");
  }

  //等待初始化完成，才继续后续操作
  await init();

  /**交互 */
  //给audio音频注册当前播放时间改变事件
  doms.audio.addEventListener("timeupdate", function () {
    setStatus(this.currentTime);
  });

  //根据播放时间，设置歌词的状态
  function setStatus(time) {
    //1、微调，使下一句早一点出来（不然有的歌词对不上）
    time += 0.5;

    //2、根据播放时间，设置对应歌词高亮
    //2.1、去除之前显示高亮歌词的active属性
    const activeLi = document.querySelector(".active");
    activeLi && activeLi.classList.remove("active"); //有就去除，没有就不做处理

    //2.2、根据歌词数组中的时间，找到播放时间对应的歌词下标（第一个比当前播放时间大的时间对应的歌词下标 - 1）
    const index = lrcData.findIndex((lrc) => lrc.time > time) - 1;

    //一开始，什么都不做
    if (index < 0) {
      return;
    }

    //2.3、给对应歌词加上active属性
    doms.ul.children[index].classList.add("active");

    //3、使ul滚动到相应位置
    //3.1、计算应该滚动的top值
    let top =
      size.liHeight * index + size.liHeight / 2 - size.containerHeight / 2;
    //3.2、top一般都是负数
    top = -top;
    //3.3、前一部分，取反后的top依旧为正数，则不做处理（比如index=0等，小于一定值的时候）
    if (top > 0) {
      return;
    }

    //3.4、给ul设置对应的移动数据
    doms.ul.style.transform = `translateY(${top}px)`;
  }
})();
