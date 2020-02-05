const { launch } = require("qawolf");
const selectors = require("../selectors/browsing");

describe('browsing', () => {
  let browser;

  beforeAll(async () => {
    browser = await launch({ url: "localhost:3000" });
  });

  afterAll(() => browser.close());

  it('can click "anozon.me" link', async () => {
    await browser.click(selectors[0]);
  });

  it('can click "Work" link', async () => {
    await browser.click(selectors[1]);
  });

  it('can click "elzup.com 大学時代の自分跡地" link', async () => {
    await browser.click(selectors[2]);
  });
});