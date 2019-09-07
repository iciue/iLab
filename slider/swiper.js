// ~~TODO 对点击事件添加节流~~
class Swiper {
  constructor(elt, opts) {
    this.elt = elt
    this.wrap = this.elt.querySelector('.slider-wrapper')
    this.items = this.elt.querySelectorAll('ul li')
    this.index = 1
    this.hasBtn = opts.hasBtn || true
    this.hasIndicators = opts.hasIndicators || true
    this.autoPlay = opts.autoPlay || false
    this.duration = opts.duration || 800
    this.init()
  }

  init() {                    // 绘制按钮以及绑定事件
    this.copyFirstAndLast()   // 拷贝首/尾节点, 并插入到容器的首/尾

    if (this.hasBtn) {        // 绘制左右箭头并绑定事件
      this.createBtnAndBindEvent()
    }
    if (this.hasIndicators) {
      this.indicators = []
      this.createIndicators() // 绘制小圆点
      this.changeIndicator()  // 初始化小圆点
    }
    if (this.autoPlay) {      // 设置自动播放
      this.timer = this.setAutoPlay()
      this.elt.addEventListener('mouseenter', () => clearInterval(this.timer))       // 悬停时停止自动播放
      this.elt.addEventListener('mouseleave', () => this.timer = this.setAutoPlay()) // 离开容器自动播放
    }
  }

  copyFirstAndLast() {
    const first = this.items[0].cloneNode(true)
    const last = this.items[this.items.length - 1].cloneNode(true)
    this.wrap.insertBefore(last, this.items[0])
    this.wrap.appendChild(first)
  }

  createIndicators() {
    const flag = document.createDocumentFragment()
    const indicators = elt('div', 'slider-indicators')
    indicators.addEventListener('click', this.indicatorsHandler.bind(this))
    for (let i = 0; i < this.items.length; i++) {
      const it = elt('span', 'slider-indicator', i + 1)
      it.setAttribute('data-id', i + 1)
      this.indicators.push(it)
      flag.appendChild(it)
    }
    indicators.appendChild(flag)
    this.elt.appendChild(indicators)
  }

  createBtnAndBindEvent() {
    const next = this.elt.appendChild(elt('span', 'slider-btn next', '>'))
    const prev = this.elt.appendChild(elt('span', 'slider-btn prev', '<'))
    const cb = throttle(this.sliderHandler.bind(this), this.duration)
    next.addEventListener('click', cb)
    prev.addEventListener('click', cb)
  }

  sliderHandler(e) {
    const goNext = e ? e.target.classList.contains('next') : true
    const offset = goNext ? ++this.index : --this.index

    this.wrap.style.transform = `translateX(-${offset}00%)`
    this.wrap.style.transitionDuration = this.duration + 'ms'
    this.changeIndicator()

    if (this.index === 6 || this.index === 0) {
      this.index = goNext ? 1 : 5
      this.changeIndicator()
      const startTime = Date.now()
      const ani = () => {
        if (Date.now() - startTime >= this.duration) {
          this.wrap.style.transitionDuration = '0ms'
          this.wrap.style.transform = `translateX(-${this.index}00%)`
        } else {
          requestAnimationFrame(ani)
        }
      }
      ani()
    }
  }

  indicatorsHandler(e) {
    const idx = e.target.getAttribute('data-id')
    this.index = idx - 1
    this.sliderHandler()
  }

  changeIndicator() {
    this.indicators.forEach((it, idx) => {
      if (idx + 1 === this.index) {
        it.classList.add('active')
      } else {
        it.classList.remove('active')
      }
    })
  }

  setAutoPlay() {
    return setInterval(this.sliderHandler.bind(this), this.duration * 3)
  }
}



function elt(tagName, className, textCon) {
  const el = document.createElement(tagName)
  el.className = className
  el.textContent = textCon
  return el
}

function throttle(func, delay) {
  let prevTime = null
  return function () {
    const now = Date.now()
    if (!prevTime || now - prevTime >= delay) {
      console.log('大于' + delay)
      prevTime = now
      func()
    } else {
      console.log('小于延迟, 不执行操作')
    }
  }
}