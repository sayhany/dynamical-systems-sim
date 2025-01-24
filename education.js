export const systemInfo = {
    lorenz: {
        title: "Lorenz Attractor",
        description: `The Lorenz system is a system of ordinary differential equations first studied by Edward Lorenz. 
        It is notable for having chaotic solutions for certain parameter values and initial conditions. 
        The system describes atmospheric convection.`,
        equations: [
            "dx/dt = σ(y - x)",
            "dy/dt = x(ρ - z) - y",
            "dz/dt = xy - βz"
        ],
        parameters: {
            σ: {
                name: "sigma",
                description: "Prandtl number - ratio of momentum diffusivity to thermal diffusivity"
            },
            ρ: {
                name: "rho",
                description: "Rayleigh number - temperature difference between top and bottom of the system"
            },
            β: {
                name: "beta",
                description: "Physical proportion of the convection cell"
            }
        },
        stability: `The system exhibits chaotic behavior for ρ > 24.74. 
        Fixed points exist at (0,0,0) and at (±√(β(ρ-1)), ±√(β(ρ-1)), ρ-1).`,
        bifurcation: `The system undergoes a pitchfork bifurcation at ρ = 1 
        and a Hopf bifurcation at ρ ≈ 24.74.`
    },
    rossler: {
        title: "Rössler Attractor",
        description: `The Rössler attractor is a chaotic attractor defined by Otto Rössler in 1976. 
        It was designed to behave similarly to the Lorenz attractor but with a simpler form.`,
        equations: [
            "dx/dt = -y - z",
            "dy/dt = x + ay",
            "dz/dt = b + z(x - c)"
        ],
        parameters: {
            a: {
                name: "a",
                description: "Controls the rotation speed"
            },
            b: {
                name: "b",
                description: "Controls the size of the attractor"
            },
            c: {
                name: "c",
                description: "Controls the chaotic behavior"
            }
        },
        stability: `The system shows periodic behavior for c < 4.2 and becomes chaotic for larger values. 
        A single fixed point exists for small parameter values.`,
        bifurcation: `The system undergoes period-doubling bifurcations as parameter c increases, 
        leading to chaos.`
    },
    vanDerPol: {
        title: "Van der Pol Oscillator",
        description: `The Van der Pol oscillator is a non-conservative oscillator with non-linear damping. 
        It was originally developed by Balthasar van der Pol while studying vacuum tubes.`,
        equations: [
            "dx/dt = y",
            "dy/dt = μ(1 - x²)y - x",
            "dz/dt = 0"
        ],
        parameters: {
            μ: {
                name: "mu",
                description: "Nonlinear damping coefficient"
            }
        },
        stability: `The system has a unique limit cycle for μ > 0. 
        The origin is an unstable focus for μ > 0 and a stable focus for μ < 0.`,
        bifurcation: `A Hopf bifurcation occurs at μ = 0, 
        where the system transitions from having a stable fixed point to having a stable limit cycle.`
    },
    pointAttractor: {
        title: "Point Attractor",
        description: `A point attractor is the simplest type of attractor, where all trajectories converge to a single point. 
        It represents a stable equilibrium in the system.`,
        equations: [
            "dx/dt = -λx",
            "dy/dt = -λy",
            "dz/dt = -λz"
        ],
        parameters: {
            λ: {
                name: "lambda",
                description: "Rate of convergence to the origin"
            }
        },
        stability: `The origin is a globally stable fixed point for λ > 0. 
        All trajectories converge exponentially to (0,0,0).`,
        bifurcation: `No bifurcations occur in this system. 
        The qualitative behavior remains the same for all positive values of λ.`
    },
    pointRepeller: {
        title: "Point Repeller",
        description: `A point repeller is the opposite of a point attractor. 
        All trajectories diverge from the unstable equilibrium point.`,
        equations: [
            "dx/dt = λx",
            "dy/dt = λy",
            "dz/dt = λz"
        ],
        parameters: {
            λ: {
                name: "lambda",
                description: "Rate of divergence from the origin"
            }
        },
        stability: `The origin is an unstable fixed point. 
        All trajectories (except the origin itself) diverge exponentially.`,
        bifurcation: `No bifurcations occur in this system. 
        The qualitative behavior remains the same for all positive values of λ.`
    },
    doublePendulum: {
        title: "Double Pendulum",
        description: `The double pendulum is a classic example of a simple mechanical system that exhibits 
        complex chaotic behavior. It consists of one pendulum attached to another.`,
        equations: [
            "d²θ₁/dt² = [-g(2m₁+m₂)sinθ₁ - m₂gsin(θ₁-2θ₂) - 2sin(θ₁-θ₂)m₂(ω₂²l₂+ω₁²l₁cos(θ₁-θ₂))] / [l₁(2m₁+m₂-m₂cos(2(θ₁-θ₂)))]",
            "d²θ₂/dt² = [2sin(θ₁-θ₂)(ω₁²l₁(m₁+m₂)+g(m₁+m₂)cosθ₁+ω₂²l₂m₂cos(θ₁-θ₂))] / [l₂(2m₁+m₂-m₂cos(2(θ₁-θ₂)))]"
        ],
        parameters: {
            m1: {
                name: "m₁",
                description: "Mass of first bob"
            },
            m2: {
                name: "m₂",
                description: "Mass of second bob"
            },
            l1: {
                name: "l₁",
                description: "Length of first rod"
            },
            l2: {
                name: "l₂",
                description: "Length of second rod"
            },
            g: {
                name: "g",
                description: "Gravitational acceleration"
            },
            damping: {
                name: "damping",
                description: "Energy dissipation coefficient"
            }
        },
        stability: `The system has two equilibrium points: the downward position (0,0) which is stable, 
        and the upward position (π,π) which is unstable.`,
        bifurcation: `The system exhibits sensitive dependence on initial conditions, 
        a hallmark of chaos. Small changes in initial conditions lead to dramatically different trajectories.`
    }
};

export function createEducationalPanel(systemKey) {
    const info = systemInfo[systemKey];
    if (!info) return null;

    const panel = document.createElement('div');
    panel.className = 'panel educational-panel';

    // Title
    const title = document.createElement('h2');
    title.textContent = info.title;
    title.className = 'equation-title';
    panel.appendChild(title);

    // Description
    const description = document.createElement('p');
    description.textContent = info.description;
    description.className = 'system-description';
    panel.appendChild(description);

    // Equations
    const equationsContainer = document.createElement('div');
    equationsContainer.className = 'equation-display';
    info.equations.forEach(eq => {
        const eqDiv = document.createElement('div');
        eqDiv.textContent = eq;
        equationsContainer.appendChild(eqDiv);
    });
    panel.appendChild(equationsContainer);

    // Parameters
    const paramsTitle = document.createElement('h3');
    paramsTitle.textContent = 'Parameters';
    paramsTitle.className = 'section-title';
    panel.appendChild(paramsTitle);

    const paramsList = document.createElement('div');
    paramsList.className = 'params-list';
    Object.entries(info.parameters).forEach(([key, param]) => {
        const paramDiv = document.createElement('div');
        paramDiv.className = 'param-item';
        paramDiv.innerHTML = `<strong>${param.name}</strong>: ${param.description}`;
        paramsList.appendChild(paramDiv);
    });
    panel.appendChild(paramsList);

    // Stability Analysis
    const stabilityTitle = document.createElement('h3');
    stabilityTitle.textContent = 'Stability Analysis';
    stabilityTitle.className = 'section-title';
    panel.appendChild(stabilityTitle);

    const stability = document.createElement('p');
    stability.textContent = info.stability;
    panel.appendChild(stability);

    // Bifurcation Analysis
    const bifurcationTitle = document.createElement('h3');
    bifurcationTitle.textContent = 'Bifurcation Analysis';
    bifurcationTitle.className = 'section-title';
    panel.appendChild(bifurcationTitle);

    const bifurcation = document.createElement('p');
    bifurcation.textContent = info.bifurcation;
    panel.appendChild(bifurcation);

    return panel;
}
