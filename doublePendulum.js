export class DoublePendulum {
    constructor(params = {}) {
        this.params = {
            m1: params.m1 || 1.0,  // Mass of first bob
            m2: params.m2 || 1.0,  // Mass of second bob
            l1: params.l1 || 1.0,  // Length of first rod
            l2: params.l2 || 1.0,  // Length of second rod
            g: params.g || 9.81,   // Gravitational acceleration
            damping: params.damping || 0.0  // Damping coefficient
        };

        // State variables: [theta1, omega1, theta2, omega2]
        this.state = [Math.PI/2, 0, Math.PI/2, 0];
    }

    derivatives(state) {
        const [theta1, omega1, theta2, omega2] = state;
        const { m1, m2, l1, l2, g, damping } = this.params;

        const cos12 = Math.cos(theta1 - theta2);
        const sin12 = Math.sin(theta1 - theta2);
        
        // Denominator terms
        const d = (m1 + m2) * l1 - m2 * l1 * cos12 * cos12;
        
        // Calculate accelerations using the full equations of motion
        const alpha1 = (
            m2 * l1 * omega1 * omega1 * sin12 * cos12
            + m2 * g * Math.sin(theta2) * cos12
            + m2 * l2 * omega2 * omega2 * sin12
            - (m1 + m2) * g * Math.sin(theta1)
            - damping * omega1
        ) / d;

        const alpha2 = (
            -m2 * l2 * omega2 * omega2 * sin12 * cos12
            + (m1 + m2) * (g * Math.sin(theta1) * cos12 - l1 * omega1 * omega1 * sin12 - g * Math.sin(theta2))
            - damping * omega2
        ) / (m2 * l2 - m2 * l2 * cos12 * cos12);

        return [omega1, alpha1, omega2, alpha2];
    }

    step(dt) {
        // 4th order Runge-Kutta integration
        const k1 = this.derivatives(this.state);
        
        const k2State = this.state.map((x, i) => x + k1[i] * dt/2);
        const k2 = this.derivatives(k2State);
        
        const k3State = this.state.map((x, i) => x + k2[i] * dt/2);
        const k3 = this.derivatives(k3State);
        
        const k4State = this.state.map((x, i) => x + k3[i] * dt);
        const k4 = this.derivatives(k4State);

        // Update state
        this.state = this.state.map((x, i) => 
            x + (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]) * dt/6
        );

        // Calculate positions for visualization
        const { l1, l2 } = this.params;
        const [theta1, , theta2] = this.state;

        const x1 = l1 * Math.sin(theta1);
        const y1 = -l1 * Math.cos(theta1);
        const x2 = x1 + l2 * Math.sin(theta2);
        const y2 = y1 - l2 * Math.cos(theta2);

        return { x1, y1, x2, y2 };
    }

    reset() {
        this.state = [Math.PI/2, 0, Math.PI/2, 0];
    }

    getState() {
        return [...this.state];
    }

    setState(state) {
        this.state = [...state];
    }

    getParameters() {
        return { ...this.params };
    }

    setParameters(params) {
        this.params = { ...this.params, ...params };
    }

    // Get the total energy of the system
    getEnergy() {
        const { m1, m2, l1, l2, g } = this.params;
        const [theta1, omega1, theta2, omega2] = this.state;

        // Kinetic energy
        const v1Squared = l1 * l1 * omega1 * omega1;
        const v2Squared = l2 * l2 * omega2 * omega2 + 
                         l1 * l1 * omega1 * omega1 + 
                         2 * l1 * l2 * omega1 * omega2 * Math.cos(theta1 - theta2);
        
        const T = 0.5 * m1 * v1Squared + 0.5 * m2 * v2Squared;

        // Potential energy
        const y1 = -l1 * Math.cos(theta1);
        const y2 = y1 - l2 * Math.cos(theta2);
        const V = m1 * g * y1 + m2 * g * y2;

        return T + V;
    }
}
