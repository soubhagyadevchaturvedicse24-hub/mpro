import React from 'react';
import { HeartHandshake, Truck, Building2, User } from 'lucide-react';
import styles from './ProcessTimeline.module.css';

const steps = [
  {
    icon: <HeartHandshake size={24} />,
    title: "Donor",
    subtitle: "Generosity\nStarts Here"
  },
  {
    icon: <Truck size={24} />,
    title: "Verified Transport",
    subtitle: "Monitored Every\nStep of the Way"
  },
  {
    icon: <Building2 size={24} />,
    title: "Hospital",
    subtitle: "Secure. Compliant.\nIn Control."
  },
  {
    icon: <User size={24} />,
    title: "Recipient",
    subtitle: "A Second Chance\nat Life"
  }
];

const ProcessTimeline = () => {
  return (
    <div className={styles.timelineContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className={styles.step}>
            <div className={styles.iconCircle}>
              {step.icon}
            </div>
            <div className={styles.textGroup}>
              <div className={styles.title}>{step.title}</div>
              <div className={styles.subtitle}>{step.subtitle}</div>
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <div className={styles.connector}>
              <div className={styles.line} />
              <div className={styles.dot} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProcessTimeline;
