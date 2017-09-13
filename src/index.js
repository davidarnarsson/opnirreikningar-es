const makeClient = require("./elastic");
const moment = require("moment");
const { maxTimePeriod, getInvoices, getInvoiceLines } = require("./reikningar");
const { Observable } = require("rxjs/Observable");
const { BehaviorSubject } = require("rxjs/BehaviorSubject");

require("rxjs/add/observable/interval");
require("rxjs/add/observable/from");
require("rxjs/add/operator/timeout");
require("rxjs/add/operator/zip");
require("rxjs/add/operator/toPromise");
require("rxjs/add/operator/map");
require("rxjs/add/operator/scan");
require("rxjs/add/operator/concatAll");
require("rxjs/add/operator/concatMap");
require("rxjs/add/operator/do");

const argv = require("yargs")
  .usage(
    "Usage: -a:bool [auto fetch max date] -d [from date, YYYY-MM-DD] -t [to date, YYYY-MM-DD] -e [elastic host (localhost:9200)] -i [request interval, 1000] -o [request timeout, 3000] -b [batch size] -in [index-name] -it [index type]"
  )
  .demandOption(["e"]).argv;

const client = makeClient(argv.e);

async function run() {
  let toDate = moment(argv.t);
  let maxPeriod;
  try {
    maxPeriod = moment(await maxTimePeriod());
  } catch (e) {
    throw e;
  }

  // resolve max period
  if (argv.a) {
    toDate = maxPeriod;
  } else if (moment(maxPeriod).isBefore(toDate, "day")) {
    throw new Error(`The to-date cannot be after the max period supported by the website, ${maxPeriod}`);
  }

  const fromDate = (argv.d && moment(argv.d)) || moment().add(-1, "month");

  const batchSize = argv.b || 50;

  let current = 0;

  const makeBatchRequest = (start, fd = fromDate, td = toDate, length = batchSize) => ({
    fromDate: fd.format("DD.MM.YYYY"),
    toDate: td.format("DD.MM.YYYY"),
    start,
    length
  });

  const makeStaggeredObservable = subject =>
    Observable.interval(argv.i || 1000)
      .timeout(argv.o || 3000)
      .zip(subject, (a, b) => b);

  const subject = new BehaviorSubject([]);

  // choo choo, lets get this show on the road!
  subject.next(makeBatchRequest(0));

  makeStaggeredObservable(subject.asObservable())
    // Get a list of invoices
    .map(({ fromDate, toDate, start, length }) => {
      console.log(`Request: ${start} - ${start + batchSize}`);
      return getInvoices(fromDate, toDate, start, length);
    })
    .concatAll()
    .concatMap(arr =>
      // get individual invoice lines and index an item, while obeying the
      // request interval/timeout
      makeStaggeredObservable(Observable.from(arr))
        .concatMap(async item => {
          console.log(`Indexing invoice ${item.invoice_id}`);

          item.lines = await getInvoiceLines(item.invoice_id);

          return client.index(argv.in || "reikningar", argv.it || "item", item.invoice_id, item);
        })
        .scan(x => x + 1, 0)
        .toPromise()
    )
    .do(count => {
      console.log(`Indexed ${batchSize * current} - ${batchSize * current + batchSize}`);

      // trigger next batch if we receive a full batch, else we're done.
      if (count >= batchSize) {
        subject.next(makeBatchRequest(++current * batchSize));
      } else {
        subject.complete();
      }
    })
    .subscribe(null, e => console.error(e), () => console.log("Complete!"));
}

try {
  run();
} catch (e) {
  console.error(e);
}
