const makeClient = require("./elastic");
//const { Subject, Processor } = require("./processor");
const moment = require("moment");
const { maxTimePeriod, getInvoices } = require("./reikningar");
const { Observable } = require("rxjs/Observable");
const { BehaviorSubject } = require("rxjs/BehaviorSubject");

require("rxjs/add/observable/interval");
require("rxjs/add/observable/of");
require("rxjs/add/observable/from");
require("rxjs/add/observable/fromPromise");
require("rxjs/add/operator/timeout");
require("rxjs/add/operator/zip");
require("rxjs/add/operator/map");
require("rxjs/add/operator/concatAll");
require("rxjs/add/operator/combineAll");
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

  const indexItem = item => {
    console.log(`Indexing invoice ${item.invoice_id}`);
    return client.index(argv.in || "reikningar", argv.it || "item", item.invoice_id, item);
  };

  const subject = new BehaviorSubject([]);
  subject.next(makeBatchRequest(0));

  Observable.interval(argv.i || 1000)
    .timeout(argv.o || 3000)
    .zip(subject.asObservable(), (a, b) => b)
    .map(({ fromDate, toDate, start, length }) => {
      console.log(`Request: ${batchSize * start} - ${batchSize * start + batchSize}`);
      return getInvoices(fromDate, toDate, start, length);
    })
    .concatAll()
    .concatMap(arr => Observable.from(arr))
    .concatMap(indexItem)
    .combineAll()
    .do(arr => {
      console.log(`Indexed ${batchSize * current} - ${batchSize * current + batchSize} ${arr}`);
      if (arr.length >= batchSize) {
        subject.next(makeBatchRequest(++current));
      } else {
        subject.complete();
      }
    })
    .subscribe(v => console.log(v), e => console.error(e), () => console.log("Complete?"));

  //   const subject = new Subject()
  //     .processSingleCallback(({ fromDate, toDate, start, length }) => {
  //       console.log(
  //         `Request: Fetching ${start * batchSize}-${start * batchSize + length}`
  //       );
  //       return getInvoices(fromDate, toDate, start, length);
  //     })
  //     .handleResultCallback(async rs => {
  //       const data = await rs;

  //       console.log(`Response: Got ${data.length} items.`);

  //       // weird off-by-one error going on here, too lazy to figure out
  //       // whether its my code or the website's code.
  //       if (data.length === batchSize + 1) {
  //         subject.next(makeBatchRequest(current++));
  //       } else {
  //         subject.complete();
  //       }
  //     });

  //   subject.next(makeBatchRequest(current++));

  //   const processor = new Processor()
  //     .timeout(argv.o || 3000)
  //     .interval(argv.i || 1000)
  //     .process(subject)
  //     .error(err => console.error(err))
  //     .complete(() => console.log("Done?"));
  // }
}

try {
  run();
} catch (e) {
  console.error(e);
}
