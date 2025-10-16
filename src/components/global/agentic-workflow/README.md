# Agentic Workflow UI Documentation

## Overview

The Agentic Workflow UI provides a comprehensive visual interface for the multi-agent AI presentation generation system. It tracks and displays the progress of five specialized AI agents working together to create presentations.

## Architecture

### Components

#### 1. **AgenticProgressTracker**
A visual component that displays the real-time status of each AI agent in the workflow.

**Features:**
- Real-time status updates (pending, running, completed, error)
- Animated transitions and loading states
- Color-coded status indicators
- Detailed error messages
- Connection lines between steps
- Responsive design with dark mode support

**Props:**
```typescript
interface AgenticProgressTrackerProps {
  steps: AgentStep[]
  currentStep: number
  className?: string
}

interface AgentStep {
  id: string
  name: string
  description: string
  status: AgentStatus  // 'pending' | 'running' | 'completed' | 'error'
  details?: string
}
```

**Usage:**
```tsx
import { AgenticProgressTracker } from '@/components/global/agentic-workflow'

<AgenticProgressTracker 
  steps={agentSteps} 
  currentStep={2}
  className="py-4"
/>
```

---

#### 2. **AgenticWorkflowDialog**
A full-featured dialog that manages the entire workflow visualization.

**Features:**
- Modal dialog with workflow progress
- Overall progress bar
- Real-time agent status updates
- Success/error states
- Cancel functionality
- Auto-navigation on completion
- Beautiful animations with Framer Motion

**Props:**
```typescript
interface AgenticWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
  topic: string
  steps?: AgentStep[]
}
```

**Usage:**
```tsx
import { AgenticWorkflowDialog } from '@/components/global/agentic-workflow'

<AgenticWorkflowDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  topic="Introduction to AI"
  steps={workflowSteps}
  onComplete={() => router.push('/presentation/123')}
/>
```

---

#### 3. **ThemePickerWithWorkflow**
An enhanced version of ThemePicker that integrates the agentic workflow UI.

**Features:**
- Theme selection interface
- AI-powered generation with visual feedback
- Animated "Generate with AI" button
- Multi-agent workflow badge
- Seamless integration with existing UI

**Usage:**
Replace the existing ThemePicker import:
```tsx
// Before
import ThemePicker from './_components/ThemePicker'

// After
import ThemePickerWithWorkflow from './_components/ThemePickerWithWorkflow'
```

---

### The Five AI Agents

1. **Outline Generator**
   - Creates presentation structure
   - Generates 5-10 key topics
   - Status: Shows outline creation progress

2. **Content Writer**
   - Writes engaging content for each slide
   - Generates titles and body text
   - Bulk processing for efficiency

3. **Layout Designer**
   - Selects optimal layouts
   - Ensures visual variety
   - Chooses from 8+ layout types

4. **Image Query Generator**
   - Analyzes slide content
   - Generates relevant image queries
   - Determines which slides need images

5. **JSON Compiler**
   - Compiles final presentation structure
   - Formats data for rendering
   - Validates output

---

## State Management

### useAgenticWorkflowStore

A Zustand store for managing workflow state across components.

```typescript
interface AgenticWorkflowState {
  isRunning: boolean
  currentTopic: string
  progress: AgentProgress[]
  error: string | null
  
  // Actions
  startWorkflow: (topic: string) => void
  updateProgress: (stepId: string, status: AgentStatus, details?: string) => void
  completeWorkflow: () => void
  resetWorkflow: () => void
  setError: (error: string) => void
}
```

**Usage:**
```tsx
import { useAgenticWorkflowStore } from '@/store/useAgenticWorkflowStore'

const { startWorkflow, updateProgress, completeWorkflow } = useAgenticWorkflowStore()

// Start workflow
startWorkflow("Introduction to AI")

// Update progress
updateProgress('outline', 'running', 'Generating outline...')
updateProgress('outline', 'completed')

// Complete
completeWorkflow()
```

---

## Integration Guide

### Step 1: Import Components
```tsx
import { AgenticWorkflowDialog } from '@/components/global/agentic-workflow'
import { AgentStatus } from '@/components/global/agentic-workflow'
```

### Step 2: Set Up State
```tsx
const [showWorkflowDialog, setShowWorkflowDialog] = useState(false)
const [workflowSteps, setWorkflowSteps] = useState<AgentStep[]>([
  {
    id: 'outline',
    name: 'Outline Generator',
    description: 'Creating presentation structure',
    status: 'pending'
  },
  // ... other steps
])
```

### Step 3: Update Progress
```tsx
const updateStepStatus = (stepId: string, status: AgentStatus, details?: string) => {
  setWorkflowSteps(prev => prev.map(step =>
    step.id === stepId ? { ...step, status, details } : step
  ))
}
```

### Step 4: Trigger Workflow
```tsx
const handleGenerate = async () => {
  setShowWorkflowDialog(true)
  
  // Update as each agent runs
  updateStepStatus('outline', 'running')
  const outlines = await generateOutline()
  updateStepStatus('outline', 'completed')
  
  updateStepStatus('content', 'running')
  const content = await generateContent(outlines)
  updateStepStatus('content', 'completed')
  
  // ... continue for all agents
}
```

---

## Styling & Theming

### Color Schemes
- **Pending**: Gray (`#9CA3AF`)
- **Running**: Blue (`#3B82F6`) with pulse animation
- **Completed**: Green (`#10B981`)
- **Error**: Red (`#EF4444`)

### Animations
- Framer Motion for smooth transitions
- Pulse effects for active states
- Slide-in animations for steps
- Gradient overlays on buttons

### Dark Mode Support
All components support dark mode with:
- Automatic color adjustments
- Proper contrast ratios
- Theme-aware backgrounds

---

## Error Handling

### Display Errors
```tsx
updateStepStatus('content', 'error', 'Failed to generate content: API timeout')
```

### Error Recovery
```tsx
const handleRetry = () => {
  resetWorkflow()
  handleGenerate()
}
```

---

## Performance Considerations

1. **Efficient Re-renders**: Only update specific steps, not entire state
2. **Memoization**: Use React.memo for step components
3. **Lazy Loading**: Dialog only renders when open
4. **Optimistic Updates**: Show progress immediately

---

## Future Enhancements

- [ ] Add pause/resume functionality
- [ ] Include detailed agent logs
- [ ] Export workflow history
- [ ] Add custom agent configurations
- [ ] Real-time streaming updates
- [ ] Agent performance metrics
- [ ] Workflow templates

---

## Troubleshooting

### Dialog Not Showing
- Ensure `open` prop is set to `true`
- Check z-index conflicts
- Verify Dialog component is imported correctly

### Steps Not Updating
- Ensure you're calling `updateStepStatus` correctly
- Check that step IDs match exactly
- Verify state is being updated immutably

### Animations Laggy
- Reduce animation complexity
- Check for performance issues in parent components
- Consider disabling animations on low-end devices

---

## Examples

### Basic Usage
```tsx
import { AgenticWorkflowDialog } from '@/components/global/agentic-workflow'

function MyComponent() {
  const [open, setOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Generate Presentation
      </Button>
      
      <AgenticWorkflowDialog
        open={open}
        onOpenChange={setOpen}
        topic="My Presentation"
      />
    </>
  )
}
```

### Advanced Usage with Custom Steps
```tsx
const customSteps: AgentStep[] = [
  {
    id: 'research',
    name: 'Research Agent',
    description: 'Gathering information...',
    status: 'completed'
  },
  {
    id: 'analysis',
    name: 'Analysis Agent',
    description: 'Analyzing data...',
    status: 'running',
    details: 'Processing 1000 records'
  },
  {
    id: 'generation',
    name: 'Generation Agent',
    description: 'Creating output...',
    status: 'pending'
  }
]

<AgenticWorkflowDialog
  open={open}
  onOpenChange={setOpen}
  topic="Custom Workflow"
  steps={customSteps}
  onComplete={() => console.log('Done!')}
/>
```

---

## API Reference

### Components Export
```typescript
// From '@/components/global/agentic-workflow'
export { AgenticProgressTracker }
export { AgenticWorkflowDialog, useAgenticWorkflow }
export type { AgentStep, AgentStatus }
```

### Hook: useAgenticWorkflow
```typescript
const {
  open,
  setOpen,
  steps,
  updateStep,
  resetWorkflow
} = useAgenticWorkflow()
```

---

## License & Credits

Built with:
- **React** & **Next.js**
- **Framer Motion** for animations
- **Lucide React** for icons
- **Tailwind CSS** for styling
- **Zustand** for state management

Created as part of the PPT Maker AI project.
