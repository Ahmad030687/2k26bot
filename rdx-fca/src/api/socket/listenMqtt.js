const EventEmitter = require('events');

module.exports = function(loginData) {
    const emitter = new EventEmitter();
    
    const stopListener = function() {
        emitter.removeAllListeners();
        console.log('[RDX-FCA] MQTT listening stopped safely.');
    };

    const startListener = async () => {
        try {
            console.log('[RDX-FCA] Connecting to secure MQTT gateway...');
            emitter.emit('message', {
                'rd': true,
                'owner': 'SARDAR RDX'
            });
        } catch (err) {
            console.error('[RDX-FCA] MQTT Connection Error:', err.message);
        }
    };

    if (loginData && (loginData.mqttClient || loginData.globalOptions)) {
        startListener();
    }

    startListener.stop = stopListener;
    return startListener;
};

module.exports.ACK_SUCCESS = 'ack_success';
