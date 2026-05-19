const q = 'Advil';
const url = `https://api.fda.gov/drug/label.json?search=(openfda.brand_name:"${q}"+openfda.generic_name:"${q}")&limit=1`;
console.log('Fetching:', url);
fetch(url).then(r => r.json()).then(data => {
    const openfda = data.results[0].openfda;
    console.log(openfda.brand_name);
    const epc = openfda.pharm_class_epc?.[0];
    console.log('EPC:', epc);
    if (epc) {
        fetch(`https://api.fda.gov/drug/label.json?search=openfda.pharm_class_epc.exact:"${epc}"&limit=5`)
            .then(r => r.json())
            .then(d2 => console.log('Alts:', d2.results.map(r => r.openfda?.brand_name?.[0])))
    }
}).catch(console.error);
