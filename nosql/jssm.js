import { sm } from 'jssm';

const TrafficLight = sm`s1 'a' -> s2 'a' -> s3 'a' -> s4 'a' -> s5 'a' -> s1 'b' -> s3 'b' -> s5 'b' -> s2 'b' -> s4 'b' -> s1;`;
const log = s => console.log(s);

log( TrafficLight.state() );
TrafficLight.action('a');
log( TrafficLight.state() );
TrafficLight.action('a');
log( TrafficLight.state() );
TrafficLight.action('a');
log( TrafficLight.state() );
TrafficLight.action('a');
log( TrafficLight.state() );
TrafficLight.action('a');
log( TrafficLight.state() );
TrafficLight.action('b');
log( TrafficLight.state() );
TrafficLight.action('b');
log( TrafficLight.state() );
TrafficLight.action('b');
log( TrafficLight.state() );
TrafficLight.action('b');
log( TrafficLight.state() );
TrafficLight.action('b');
log( TrafficLight.state() );