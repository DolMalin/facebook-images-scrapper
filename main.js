const config = require('./config')
const fs = require('fs')
const puppeteer = require('puppeteer');

const acceptCookies = async (page) => {
    // find then click on accept cookies button
    const cookieButtonSelector = '[data-cookiebanner="accept_button"]'
    await page.waitForSelector(cookieButtonSelector)
    await page.click(cookieButtonSelector)
}

const login = async (page) => {
    // get user ids inputs and fill they
    const emailInput = 'input[type="text"]'
    const passwordInput = 'input[type="password"]'
    await page.waitForSelector(emailInput)
    await page.waitForSelector(passwordInput)

    await page.evaluate( (email, password, emailInput, passwordInput) => {
        document.querySelector(emailInput).value = email
        document.querySelector(passwordInput).value = password
    }, config.email, config.password, emailInput, passwordInput)

    // find then click on submit button
    await page.waitForTimeout(2000)
    const submitButton = 'button[type="submit"]'
    await page.waitForSelector(submitButton)
    await page.click(submitButton)

    await page.waitForNavigation()
}

const scroll = async (page, maxScroll) => {
    await page.evaluate(async maxScroll => {
        await new Promise(resolve => {
            const distance = 100
            let scrolledDistance = 0
            const timer = setInterval(() => {
                window.scrollBy(0, distance)
                scrolledDistance += distance
                if (scrolledDistance >= maxScroll) {
                    clearInterval(timer)
                    resolve()
                }
            }, 10)
        })
    }, maxScroll)
}

const formatArray = (arr) => {
    // let newArr = arr.splice(0,1)
    return arr.splice(0,1)
}

const scrape = async () => {
    const browser = await puppeteer.launch({
        "headless":true,
        args:['--disable-notifications']
    })

    const page = await browser.newPage()
    await page.goto('https://facebook.com')
    await page.waitForTimeout(1000)
    // login
    try {
        console.log('Try to log in...\n')
        acceptCookies(page)
        login(page)
    } catch (err) {
        console.log('Error logging into your facebook account\n')
        console.log(err)
    }


    // open facebook group/page and scroll down
    try {
        await page.waitForNavigation()
        console.log('Logged into your facebook account\n')
        console.log(`Openning ${config.page_name}...\n`)
        await page.goto(`${config.page_url}/feed`)
        console.log('Done!\n')
        console.log('Scrolling down the feed...\n')
        await scroll(page, config.scroll_duration)
    } catch(err) {
        console.log(err)
    }

    // get all post images url
    try { 
        console.log('Done!\n')
        console.log('Fetching all the images...\n')
        await page.waitForTimeout(2000)
        const imgs = await page.$$eval('img[src*="https://scontent"]', imgs => imgs.map(img => img.getAttribute('src')))
        let pageName = config.page_name
        let formattedPageName = pageName.split(' ').join('-')
        fs.writeFileSync(`./images_url/${formattedPageName}.json`, JSON.stringify(imgs), 'utf-8')
        console.log('Done!\n')
        console.log('Find your stuff here :')
        console.log(`${__dirname}/images_url/${formattedPageName}.json`)
    } catch (err) {
        console.log(err)
    }
}

scrape()
