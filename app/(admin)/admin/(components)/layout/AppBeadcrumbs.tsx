import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
export interface BreadcrumbItemType {
  title: string
  href?: string
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItemType[]
}

export function AppBreadcrumbs({ items }: AppBreadcrumbsProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <BreadcrumbItem
            key={index}
            className={index < items.length - 1 ? "hidden md:block" : ""}
          >
            {item.href && index < items.length - 1 ? (
              <div className='flex items-center gap-2'>
                <BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
                <BreadcrumbSeparator className="hidden md:block" />
              </div>
            ) : (
              <BreadcrumbPage>{item.title}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
