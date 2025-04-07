import Badge from '../shared/badge';

export type PlanBadgeType = 'pro' | 'enterprise' | 'trial';

interface PlanBadgeProps {
  type: PlanBadgeType;
}

const badges: Record<PlanBadgeType, { text: string; tone: 'yellow' | 'blue' }> =
  {
    pro: { text: 'Pro', tone: 'yellow' },
    enterprise: { text: 'Enterprise', tone: 'blue' },
    trial: { text: 'Pro Trial', tone: 'yellow' },
  };

const PlanBadge: React.FC<PlanBadgeProps> = ({ type }) => {
  const { text, tone } = badges[type];

  return (
    <Badge style="primary" tone={tone}>
      {text}
    </Badge>
  );
};

export default PlanBadge;
