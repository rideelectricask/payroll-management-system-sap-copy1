import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import {
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  ListItemSuffix,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Input,
  Drawer,
  Card,
} from "@material-tailwind/react";

import {
  PresentationChartBarIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  PowerIcon,
  UserGroupIcon,
  PhoneIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/solid";

import {
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

import TagFilter from "./TagFilter";

const MENU_ITEMS = {
  ANALYTICS: 1,
  OPERATIONS: 2,
  RESOURCES: 3,
  DRIVER_MANAGEMENT: 4,
  MOBILE_SELLING: 5,
};

const PROTECTED_ROLES = ['admin', 'developer', 'support'];

const HeaderBar = ({ shouldShowTagFilter, openDrawer, isDrawerOpen, tagFilterProps }) => (
  <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
    <div className={`flex items-center justify-between px-6 ${shouldShowTagFilter ? 'py-3' : 'h-16'}`}>
      <div className="flex items-center gap-4 flex-shrink-0">
        <IconButton 
          variant="text" 
          size="lg" 
          onClick={openDrawer}
          className="hover:bg-gray-50 transition-colors"
        >
          {isDrawerOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </IconButton>

        <Link to="/pms" className="flex-shrink-0">
          <Typography variant="h6" color="blue-gray" className="font-semibold">
            Payroll Management System
          </Typography>
        </Link>
      </div>

      {shouldShowTagFilter && tagFilterProps && (
        <div className="flex-1 max-w-md ml-8">
          <TagFilter {...tagFilterProps} />
        </div>
      )}
    </div>
  </div>
);

const SearchBar = () => (
  <div className="px-4 py-3 border-b border-gray-100">
    <div className="relative">
      <Input 
        placeholder="Search menus, projects..."
        className="!border-gray-200 focus:!border-blue-500 !bg-gray-50 focus:!bg-white transition-all duration-200 !rounded-lg pl-10 pr-4 py-2 text-sm !outline-none"
        labelProps={{ className: "hidden" }}
        containerProps={{ className: "min-w-0 !min-h-0" }}
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  </div>
);

const MenuAccordion = ({ menuId, open, handleOpen, icon: Icon, title, children }) => (
  <Accordion
    open={open === menuId}
    icon={
      <ChevronDownIcon
        strokeWidth={2.5}
        className={`h-4 w-4 transition-transform ${open === menuId ? "rotate-180" : ""}`}
      />
    }
  >
    <ListItem className="p-0" selected={open === menuId}>
      <AccordionHeader 
        onClick={() => handleOpen(menuId)} 
        className="border-b-0 p-3 hover:bg-gray-50 transition-colors"
      >
        <ListItemPrefix>
          <Icon className="h-5 w-5" />
        </ListItemPrefix>
        <Typography color="blue-gray" className="mr-auto font-medium text-sm">
          {title}
        </Typography>
      </AccordionHeader>
    </ListItem>
    <AccordionBody className="py-1">
      <List className="p-0 ml-4">
        {children}
      </List>
    </AccordionBody>
  </Accordion>
);

const MenuItem = ({ to, onClick, children, className = "" }) => (
  <Link to={to} onClick={onClick}>
    <ListItem className={`hover:bg-gray-50 transition-colors rounded-md ${className}`}>
      <ListItemPrefix>
        <ChevronRightIcon strokeWidth={2} className="h-4 w-4" />
      </ListItemPrefix>
      <Typography className="text-sm">
        {children}
      </Typography>
    </ListItem>
  </Link>
);

const SimpleMenuItem = ({ to, onClick, icon: Icon, label, suffix, isLogout = false }) => (
  <Link to={to} onClick={onClick}>
    <ListItem className={`transition-colors rounded-md ${isLogout ? 'hover:bg-red-50 text-red-600' : 'hover:bg-gray-50'}`}>
      <ListItemPrefix>
        <Icon className={`h-5 w-5 ${isLogout ? 'text-red-600' : ''}`} />
      </ListItemPrefix>
      <Typography className={`font-medium text-sm ${isLogout ? 'text-red-600' : ''}`}>
        {label}
      </Typography>
      {suffix && (
        <ListItemSuffix>
          {suffix}
        </ListItemSuffix>
      )}
    </ListItem>
  </Link>
);

export function DefaultSidebar({ tagFilterProps }) {
  const [open, setOpen] = React.useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value);
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const shouldShowTagFilter = location.pathname === "/project/cost-and-financial-intelligence";

  return (
    <>
      <HeaderBar 
        shouldShowTagFilter={shouldShowTagFilter}
        openDrawer={openDrawer}
        isDrawerOpen={isDrawerOpen}
        tagFilterProps={tagFilterProps}
      />

      <div className={`${shouldShowTagFilter ? 'h-20' : 'h-16'}`} />

      <Drawer 
        open={isDrawerOpen} 
        onClose={closeDrawer} 
        overlay={false} 
        className="z-40"
      >
        <Card 
          color="transparent" 
          shadow={false} 
          className="h-screen w-full p-0 bg-white border-r border-gray-200"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <Link to="/" onClick={closeDrawer}>
              <Typography variant="h6" color="blue-gray" className="font-semibold text-base">
                PMS
              </Typography>
            </Link>
            <IconButton 
              variant="text" 
              size="sm" 
              onClick={closeDrawer}
              className="hover:bg-gray-50 transition-colors lg:hidden"
            >
              <XMarkIcon className="h-5 w-5" />
            </IconButton>
          </div>

          {user && (
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                  <UserCircleIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      PROTECTED_ROLES.includes(user.role) 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <SearchBar />

          <div className="flex-1 overflow-y-auto">
            <List className="p-2">
              <MenuAccordion
                menuId={MENU_ITEMS.ANALYTICS}
                open={open}
                handleOpen={handleOpen}
                icon={PresentationChartBarIcon}
                title="Analytics"
              >
                <MenuItem to="/analytics/executive-overview-dashboard" onClick={closeDrawer}>
                  Executive Dashboard
                </MenuItem>
                <MenuItem to="/analytics/cost-and-financial-intelligence" onClick={closeDrawer}>
                  Financial Intelligence
                </MenuItem>
              </MenuAccordion>

              <MenuAccordion
                menuId={MENU_ITEMS.OPERATIONS}
                open={open}
                handleOpen={handleOpen}
                icon={ShoppingBagIcon}
                title="Operations"
              >
                <MenuItem to="/operations/orders-management" onClick={closeDrawer}>
                  Orders Management
                </MenuItem>
                <MenuItem to="/operations/inventory-control" onClick={closeDrawer}>
                  Inventory Control
                </MenuItem>
              </MenuAccordion>

              <MenuAccordion
                menuId={MENU_ITEMS.RESOURCES}
                open={open}
                handleOpen={handleOpen}
                icon={TruckIcon}
                title="Resources"
              >
                <MenuItem to="/resources/mitra-operations" onClick={closeDrawer}>
                  Mitra Operations
                </MenuItem>
                <MenuItem to="/resources/fleet-management" onClick={closeDrawer}>
                  Fleet Operations
                </MenuItem>
              </MenuAccordion>

              <MenuAccordion
                menuId={MENU_ITEMS.DRIVER_MANAGEMENT}
                open={open}
                handleOpen={handleOpen}
                icon={UserGroupIcon}
                title="Driver Management"
              >
                <MenuItem to="/driver-management/mitra-performance" onClick={closeDrawer}>
                  Mitra Performance
                </MenuItem>
                <MenuItem to="/driver-management/shipment-performance" onClick={closeDrawer}>
                  Shipment Performance
                </MenuItem>
                <MenuItem to="/driver-management/task-management" onClick={closeDrawer}>
                  Task Management
                </MenuItem>
                <MenuItem to="/driver-management/attendance-tracking" onClick={closeDrawer}>
                  Attendance Tracking
                </MenuItem>
                <MenuItem to="/driver-management/training-certification" onClick={closeDrawer}>
                  Training & Certification
                </MenuItem>
                <MenuItem to="/driver-management/message-dispatcher" onClick={closeDrawer}>
                  Message Dispatcher
                </MenuItem>
              </MenuAccordion>

              <MenuAccordion
                menuId={MENU_ITEMS.MOBILE_SELLING}
                open={open}
                handleOpen={handleOpen}
                icon={BuildingStorefrontIcon}
                title="Mobile Selling"
              >
                <MenuItem to="/mobile-selling/mitra-mobile-selling" onClick={closeDrawer}>
                  Mitra Mobile Selling
                </MenuItem>
              </MenuAccordion>

              <div className="my-2 border-t border-gray-200" />

              <SimpleMenuItem 
                to="/inbox" 
                onClick={closeDrawer}
                icon={InboxIcon}
                label="Inbox"
                suffix={
                  <Chip 
                    value="14" 
                    size="sm" 
                    variant="ghost" 
                    color="blue" 
                    className="rounded-full text-xs font-medium"
                  />
                }
              />

              <SimpleMenuItem 
                to="/contact" 
                onClick={closeDrawer}
                icon={PhoneIcon}
                label="Contact"
              />

              <SimpleMenuItem 
                to="/profile" 
                onClick={closeDrawer}
                icon={UserCircleIcon}
                label="Profile"
              />

              <SimpleMenuItem 
                to="/settings" 
                onClick={closeDrawer}
                icon={Cog6ToothIcon}
                label="Settings"
              />

              <SimpleMenuItem 
                to="/logout" 
                onClick={closeDrawer}
                icon={PowerIcon}
                label="Log Out"
                isLogout
              />
            </List>
          </div>
        </Card>
      </Drawer>
    </>
  );
}