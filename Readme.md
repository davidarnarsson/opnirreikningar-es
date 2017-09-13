# Opnir reikningar, ElasticSearch edition

Þetta tól dælir gögnunum á opnirreikningar.is inn í elastic grunn.

## Notkun 

`node index.js 
-a:bool [auto fetch max date] -d [from date, YYYY-MM-DD] -t [to date, YYYY-MM-DD] -e [elastic host (localhost:9200)] -i [request interval, 1000] -o [request timeout, 3000] -b [batch size] -in [index-name, default "reikningar"] -it [index type, default "item"]`

Til dæmis: 

Sækja frá nýjustu færslum og mánuð aftur í tímann og dæla inn á elastic instance á localhost:9200

`node index -a -e=localhost:9200`

Sækja færslur frá 2017-08-30 til 2017-08-31 og dæla inn á localhost:9200

`node index -d=2017-08-30 -t=2017-08-31 -e=localhost:9200`