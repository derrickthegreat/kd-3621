import { AppBreadcrumbs } from "../../(components)/layout/AppBeadcrumbs";

const UploadScan = () => {
    return (
        <>
        <AppBreadcrumbs items={[{title: "Admin", href: "/admin" }, { title: "Settings", href: "/settings" }, { title: "Upload a Scan" }]} />
            Hello World!
        </>
    )
}

export default UploadScan;