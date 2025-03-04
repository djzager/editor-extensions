import "./incidentTable.css";
import { basename } from "node:path";
import React, { FC, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  LabelGroup,
  Label,
  Dropdown,
  MenuToggleElement,
  MenuToggle,
  MenuToggleCheckbox,
  DropdownList,
  DropdownItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  ToolbarFilter,
} from "@patternfly/react-core";
import { EnhancedIncident, Incident } from "@editor-extensions/shared";
import { Table, Tr, Tbody, Td } from "@patternfly/react-table";
import { useExtensionStateContext } from "../../context/ExtensionStateContext";
import { openFile } from "../../hooks/actions";
import { getIncidentRelativePath } from "../../utils/incident";
import GetSolutionDropdown from "../GetSolutionDropdown";

export interface EnhancedIncidentTableProps {
  incidents: EnhancedIncident[];
  isReadOnly?: boolean;
}

export const EnhancedIncidentTable: FC<EnhancedIncidentTableProps> = ({
  incidents,
  isReadOnly = false,
}) => {
  const { state, dispatch } = useExtensionStateContext();
  const [focusedIncident, setFocusedIncident] = useState<Incident | null>(null);
  const [selectedIncidents, setSelectedIncidents] = useState<EnhancedIncident[]>([]);
  const [bulkSelection, setBulkSelection] = React.useState("");
  const [isBulkSelectDropdownOpen, setIsBulkSelectDropdownOpen] = useState<boolean>(false);
  const { workspaceRoot } = state;

  const [searchValue, setSearchValue] = React.useState("");
  const [filters, setFilters] = React.useState<{
    ruleset: string[];
    category: string[];
    label: string[];
    file: string[];
  }>({
    ruleset: [],
    category: [],
    label: [],
    file: [],
  });
  const [isFilterExpanded, setIsFilterExpanded] = React.useState<{
    ruleset: boolean;
    category: boolean;
    label: boolean;
    file: boolean;
  }>({
    ruleset: false,
    category: false,
    label: false,
    file: false,
  });

  const filteredIncidents = useMemo(() => {
    console.log("Incidents", incidents);
    const newIncidents = incidents.filter((incident) => {
      // Check Ruleset filter
      if (filters.ruleset.length > 0 && !filters.ruleset.includes(incident.ruleset_name!)) {
        return false;
      }

      // Check Category filter
      if (filters.category.length > 0 && !filters.category.includes(incident.violation_category!)) {
        return false;
      }

      // Check Label filter
      if (
        filters.label.length > 0 &&
        !incident.violation_labels?.some((label) => filters.label.includes(label))
      ) {
        return false;
      }

      // Check File filter
      const incidentFile = getIncidentRelativePath(incident, workspaceRoot);
      if (filters.file.length > 0 && !filters.file.includes(incidentFile)) {
        return false;
      }

      // Check Search filter (matches any text-based field)
      if (searchValue.trim() !== "") {
        const searchLower = searchValue.toLowerCase();
        const matchesSearch =
          incident.ruleset_name?.toLowerCase().includes(searchLower) ||
          incident.violation_category?.toLowerCase().includes(searchLower) ||
          incident.violation_labels?.some((label) => label.toLowerCase().includes(searchLower)) ||
          incidentFile.toLowerCase().includes(searchLower);

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
    console.log("New Incidents", newIncidents.length);
    return newIncidents;
  }, [incidents, filters, searchValue, workspaceRoot]);

  const rulesetOptions = useMemo(
    () => [...new Set(filteredIncidents.map((i) => i.ruleset_name))],
    [filteredIncidents],
  );
  const categoryOptions = useMemo(
    () => [...new Set(filteredIncidents.map((i) => i.violation_category))],
    [filteredIncidents],
  );
  const labelOptions = useMemo(
    () => [...new Set(filteredIncidents.flatMap((i) => i.violation_labels))],
    [filteredIncidents],
  );
  const fileOptions = useMemo(
    () => [...new Set(filteredIncidents.map((i) => getIncidentRelativePath(i, workspaceRoot)))],
    [filteredIncidents, workspaceRoot],
  );

  const filterOptions = {
    ruleset: rulesetOptions,
    category: categoryOptions,
    label: labelOptions,
    file: fileOptions,
  };

  const onSearchValueChange = (value: string) => setSearchValue(value);

  const onFilterSelect = (type: keyof typeof filters, selection: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(selection)
        ? prev[type].filter((item) => item !== selection)
        : [...prev[type], selection],
    }));
  };

  const onDeleteFilter = (type: string, id: string) => {
    if (type === "Ruleset") {
      setFilters({
        ruleset: filters.ruleset.filter((fil: string) => fil !== id),
        category: filters.category,
        label: filters.label,
        file: filters.file,
      });
    } else if (type === "Category") {
      setFilters({
        ruleset: filters.ruleset,
        category: filters.category.filter((fil: string) => fil !== id),
        label: filters.label,
        file: filters.file,
      });
    } else if (type === "Label") {
      setFilters({
        ruleset: filters.ruleset,
        category: filters.category.filter((fil: string) => fil !== id),
        label: filters.label.filter((fil: string) => fil !== id),
        file: filters.file,
      });
    } else if (type === "File") {
      setFilters({
        ruleset: filters.ruleset,
        category: filters.category,
        label: filters.label,
        file: filters.file.filter((fil: string) => fil !== id),
      });
    } else {
      setFilters({ ruleset: [], category: [], label: [], file: [] });
    }
  };

  const onDeleteFilterGroup = (type: string) => {
    if (type === "Ruleset") {
      setFilters({
        ruleset: [],
        category: filters.category,
        label: filters.label,
        file: filters.file,
      });
    } else if (type === "Category") {
      setFilters({
        ruleset: filters.ruleset,
        category: [],
        label: filters.label,
        file: filters.file,
      });
    } else if (type === "Label") {
      setFilters({
        ruleset: filters.ruleset,
        category: filters.category,
        label: [],
        file: filters.file,
      });
    } else if (type === "File") {
      setFilters({
        ruleset: filters.ruleset,
        category: filters.category,
        label: filters.label,
        file: [],
      });
    }
  };

  const selectAllIncidents = (isSelecting: boolean) =>
    setSelectedIncidents(isSelecting ? incidents.map((r) => r) : []);

  const isIncidentSelected = (row: EnhancedIncident) => selectedIncidents.includes(row);

  const handleIncidentSelect = (incident: Incident) => {
    setFocusedIncident(incident);
    dispatch(openFile(incident.uri, incident.lineNumber ?? 0));
  };

  // Toggle selection for a single incident
  const toggleIncidentSelection = (incident) => {
    setSelectedIncidents(
      (prevSelected) =>
        prevSelected.some((i) => i === incident)
          ? prevSelected.filter((i) => i !== incident) // Deselect
          : [...prevSelected, incident], // Select
    );
  };

  const buildBulkSelectDropdown = () => {
    const numSelected = selectedIncidents.length;
    const allSelected = numSelected === incidents.length;
    const anySelected = numSelected > 0;
    const someChecked = anySelected ? null : false;
    const isChecked = allSelected ? true : someChecked;

    const items = (
      <>
        <DropdownItem
          onClick={() => {
            setSelectedIncidents([]);
            setIsBulkSelectDropdownOpen(false);
          }}
        >
          Select none (0 items)
        </DropdownItem>
        <DropdownItem
          onClick={() => {
            selectAllIncidents(bulkSelection !== "all");
            setIsBulkSelectDropdownOpen(false);
          }}
        >
          Select all ({incidents.length} items)
        </DropdownItem>
      </>
    );

    return (
      <Dropdown
        role="menu"
        isOpen={isBulkSelectDropdownOpen}
        onOpenChange={(isOpen: boolean) => setIsBulkSelectDropdownOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            isExpanded={isBulkSelectDropdownOpen}
            onClick={() => setIsBulkSelectDropdownOpen(!isBulkSelectDropdownOpen)}
            aria-label="Select cards"
            splitButtonOptions={{
              items: [
                <MenuToggleCheckbox
                  id="split-dropdown-checkbox"
                  key="split-dropdown-checkbox"
                  aria-label={anySelected ? "Deselect all cards" : "Select all cards"}
                  isChecked={isChecked}
                  onClick={() =>
                    anySelected
                      ? setSelectedIncidents([])
                      : selectAllIncidents(bulkSelection !== "all")
                  }
                >
                  {numSelected !== 0 && `${numSelected} selected`}
                </MenuToggleCheckbox>,
              ],
            }}
          ></MenuToggle>
        )}
      >
        <DropdownList>{items}</DropdownList>
      </Dropdown>
    );
  };

  const toggleGroupItems = (
    <React.Fragment>
      <ToolbarItem>
        <SearchInput
          aria-label="Search incidents"
          onChange={(_event, value) => onSearchValueChange(value)}
          value={searchValue}
          onClear={() => {
            onSearchValueChange("");
          }}
        />
      </ToolbarItem>
      <ToolbarGroup variant="filter-group">
        <ToolbarFilter
          labels={filters.ruleset}
          deleteLabel={(category, label) => onDeleteFilter(category as string, label as string)}
          deleteLabelGroup={(category) => onDeleteFilterGroup(category as string)}
          categoryName="Ruleset"
        >
          <Select
            aria-label="Ruleset"
            role="menu"
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setIsFilterExpanded((prev) => ({ ...prev, ruleset: !prev.ruleset }))}
                isExpanded={isFilterExpanded.ruleset}
                style={{ width: "140px" } as React.CSSProperties}
              >
                Ruleset
                {filters.ruleset.length > 0 && <Badge isRead>{filters.ruleset.length}</Badge>}
              </MenuToggle>
            )}
            onSelect={(
              _event: React.MouseEvent | undefined,
              value: string | number | undefined,
            ) => {
              onFilterSelect("ruleset", value as string);
            }}
            selected={filters.ruleset}
            isOpen={isFilterExpanded.ruleset}
            onOpenChange={(isOpen) => setIsFilterExpanded((prev) => ({ ...prev, ruleset: isOpen }))}
          >
            <SelectList>
              {rulesetOptions.map((name) => (
                <SelectOption key={"ruleset-" + name} value={name}>
                  {name}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </ToolbarFilter>
        <ToolbarFilter
          labels={filters.category}
          deleteLabel={(category, label) => onDeleteFilter(category as string, label as string)}
          deleteLabelGroup={(category) => onDeleteFilterGroup(category as string)}
          categoryName="Category"
        >
          <Select
            aria-label="Category"
            role="menu"
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() =>
                  setIsFilterExpanded((prev) => ({ ...prev, category: !prev.category }))
                }
                isExpanded={isFilterExpanded.category}
                style={{ width: "140px" } as React.CSSProperties}
              >
                Category
                {filters.category.length > 0 && <Badge isRead>{filters.category.length}</Badge>}
              </MenuToggle>
            )}
            onSelect={(
              _event: React.MouseEvent | undefined,
              value: string | number | undefined,
            ) => {
              onFilterSelect("category", value as string);
            }}
            selected={filters.category}
            isOpen={isFilterExpanded.category}
            onOpenChange={(isOpen) =>
              setIsFilterExpanded((prev) => ({ ...prev, category: isOpen }))
            }
          >
            <SelectList>
              {categoryOptions.map((name) => (
                <SelectOption key={"category-" + name} value={name}>
                  {name}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </ToolbarFilter>
        <ToolbarFilter
          labels={filters.label}
          deleteLabel={(category, label) => onDeleteFilter(category as string, label as string)}
          deleteLabelGroup={(category) => onDeleteFilterGroup(category as string)}
          categoryName="Label"
        >
          <Select
            aria-label="Label"
            role="menu"
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setIsFilterExpanded((prev) => ({ ...prev, label: !prev.label }))}
                isExpanded={isFilterExpanded.label}
                style={{ width: "140px" } as React.CSSProperties}
              >
                Label
                {filters.label.length > 0 && <Badge isRead>{filters.label.length}</Badge>}
              </MenuToggle>
            )}
            onSelect={(
              _event: React.MouseEvent | undefined,
              value: string | number | undefined,
            ) => {
              onFilterSelect("label", value as string);
            }}
            selected={filters.label}
            isOpen={isFilterExpanded.label}
            onOpenChange={(isOpen) => setIsFilterExpanded((prev) => ({ ...prev, label: isOpen }))}
          >
            <SelectList>
              {labelOptions.map((name) => (
                <SelectOption key={"label-" + name} value={name}>
                  {name}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </ToolbarFilter>
        <ToolbarFilter
          labels={filters.file}
          deleteLabel={(category, label) => onDeleteFilter(category as string, label as string)}
          deleteLabelGroup={(category) => onDeleteFilterGroup(category as string)}
          categoryName="File"
        >
          <Select
            aria-label="File"
            role="menu"
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setIsFilterExpanded((prev) => ({ ...prev, file: !prev.file }))}
                isExpanded={isFilterExpanded.file}
                style={{ width: "140px" } as React.CSSProperties}
              >
                File
                {filters.file.length > 0 && <Badge isRead>{filters.file.length}</Badge>}
              </MenuToggle>
            )}
            onSelect={(
              _event: React.MouseEvent | undefined,
              value: string | number | undefined,
            ) => {
              onFilterSelect("file", value as string);
            }}
            popperProps={{
              appendTo: document.body,
              position: "right",
              enableFlip: true,
              preventOverflow: true,
            }}
            selected={filters.file}
            isOpen={isFilterExpanded.file}
            onOpenChange={(isOpen) => setIsFilterExpanded((prev) => ({ ...prev, file: isOpen }))}
          >
            <SelectList>
              {fileOptions.map((name) => (
                <SelectOption key={"file-" + name} value={name}>
                  {name}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </ToolbarFilter>
      </ToolbarGroup>
    </React.Fragment>
  );

  return (
    <>
      <Toolbar clearAllFilters={() => onDeleteFilter("", "")}>
        <ToolbarContent>
          <ToolbarGroup>
            <ToolbarItem>{buildBulkSelectDropdown()}</ToolbarItem>
          </ToolbarGroup>
          {toggleGroupItems}
          <ToolbarItem align={{ default: "alignEnd" }}>
            <GetSolutionDropdown incidents={selectedIncidents} scope="in-between" />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table aria-label="Incident Table" borders={true}>
        <Tbody>
          {filteredIncidents.map((incident, rowIndex) => {
            return (
              <Tr key={"incident-" + rowIndex}>
                <Td
                  select={{
                    rowIndex,
                    onSelect: () => toggleIncidentSelection(incident),
                    isSelected: isIncidentSelected(incident),
                  }}
                />
                <Td>
                  <Card
                    isSelectable
                    isSelected={isIncidentSelected(incident)}
                    onClick={() => toggleIncidentSelection(incident)}
                    isCompact
                  >
                    <CardTitle>
                      <b>{incident.ruleset_name}:</b> {incident.violation_description}
                      {"  "}
                      <LabelGroup>
                        {incident.violation_labels?.map((violationLabel) => (
                          <Label key={"incident-" + rowIndex + violationLabel} variant="outline">
                            {violationLabel}
                          </Label>
                        ))}
                      </LabelGroup>
                    </CardTitle>
                    <CardBody>
                      <Badge>{incident.violation_category}</Badge>
                      {"  "}
                      Location:{"  "}
                      <Button
                        component="a"
                        variant="link"
                        isInline
                        onClick={() => handleIncidentSelect(incident)}
                      >
                        {getIncidentRelativePath(incident, workspaceRoot)}:{incident.lineNumber}
                      </Button>
                    </CardBody>
                  </Card>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </>
  );
};
