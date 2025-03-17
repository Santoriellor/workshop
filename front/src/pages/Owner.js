import { useState, useEffect } from "react";
// Utils
import getFilterOptions from "../utils/filterBarFilterOptions";
// Components
import Page from "../components/Page";
import OwnerCard from "../components/owners/OwnerCard";
import OwnerModal from "../components/owners/OwnerModal";
// Contexts
import { useOwnerContext } from "../contexts/OwnerContext";
import { useGlobalContext } from "../contexts/GlobalContext";
// Styles
import "../styles/Owner.css";

const Owner = () => {
  const { owners } = useOwnerContext();
  const { setModalComponent } = useGlobalContext();

  const [filters, setFilters] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    setModalComponent(() => OwnerModal);
  }, []);

  return (
    <Page
      itemType="Owner"
      filters={{ ...filters, type: "owner" }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).owners}
      items={owners}
      CardComponent={OwnerCard}
    />
  );
};

export default Owner;
