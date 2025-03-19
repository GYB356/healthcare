# Component Documentation

## UI Components

### AlertDialog
A modal dialog that interrupts the user with important content and expects a response.

```tsx
import { AlertDialog } from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger>Open</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### ConfirmationDialog
A specialized dialog for confirming destructive actions.

```tsx
import { ConfirmationDialog } from "@/components/confirmation-dialog"

<ConfirmationDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onConfirm={handleDelete}
  title="Delete Record"
  description="Are you sure you want to delete this record? This action cannot be undone."
  actionLabel="Delete"
  variant="destructive"
/>
```

### ErrorBoundary
A component that catches JavaScript errors in its child component tree and displays a fallback UI.

```tsx
import { ErrorBoundary } from "@/components/error-boundary"

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Loading Skeletons

### MedicalRecordSkeleton
A placeholder loading state for a single medical record.

```tsx
import { MedicalRecordSkeleton } from "@/components/skeletons/medical-record-skeleton"

<MedicalRecordSkeleton />
```

### MedicalRecordListSkeleton
A placeholder loading state for a list of medical records.

```tsx
import { MedicalRecordListSkeleton } from "@/components/skeletons/medical-record-skeleton"

<MedicalRecordListSkeleton count={5} />
```

## Page Components

### PatientsPage
A page component for displaying and managing patient records.

```tsx
// app/(dashboard)/patients/page.tsx
import { PatientsPage } from "@/app/(dashboard)/patients/page"

// Features:
// - Patient search
// - Pagination
// - Role-based access control
// - Loading states
```

### MedicalRecordPage
A page component for viewing and editing individual medical records.

```tsx
// app/(dashboard)/medical-records/[id]/page.tsx
import { MedicalRecordPage } from "@/app/(dashboard)/medical-records/[id]/page"

// Features:
// - Record details display
// - File attachments
// - Edit capabilities for doctors
// - Loading states
```

## Utility Components

### Card
A versatile card component for displaying content in a contained manner.

```tsx
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Input
A styled input component with various states and variants.

```tsx
import { Input } from "@/components/ui/input"

<Input
  type="text"
  placeholder="Search..."
  value={value}
  onChange={handleChange}
/>
```

### Button
A customizable button component with different variants and states.

```tsx
import { Button } from "@/components/ui/button"

<Button variant="default" onClick={handleClick}>
  Click me
</Button>
```

## Props Reference

### ConfirmationDialog Props
| Prop | Type | Description |
|------|------|-------------|
| open | boolean | Controls the visibility of the dialog |
| onOpenChange | (open: boolean) => void | Callback when dialog visibility changes |
| onConfirm | () => void | Callback when action is confirmed |
| title | string | Dialog title |
| description | string | Dialog description |
| actionLabel | string | Label for confirm button |
| cancelLabel | string | Label for cancel button |
| variant | "default" \| "destructive" | Visual style of the dialog |

### ErrorBoundary Props
| Prop | Type | Description |
|------|------|-------------|
| children | ReactNode | Components to be wrapped |
| fallback | ReactNode | Optional custom fallback UI |

### MedicalRecordListSkeleton Props
| Prop | Type | Description |
|------|------|-------------|
| count | number | Number of skeleton items to display | 